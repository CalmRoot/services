const express = require('express');
const router = express.Router();
const { ddbDocClient } = require('../config/dynamodb-client');
const { GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { authenticate } = require('../middleware/auth.middleware');
const { analyzeWellness, getChatResponse, getTherapistRecommendation, analyzeReport } = require('../utils/bedrockAI');
const { evaluateAndEscalate } = require('../utils/riskEngine');
const User = require('../models/User');

const USERS_TABLE = 'calmroot-users';

// POST /api/wellness/analyze
// Called after mood log or assessment submission
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const {
      moodScore,
      moodNote,
      phq9Score,
      gad7Score,
      triggerSource // 'MOOD' | 'ASSESSMENT' | 'JOURNAL'
    } = req.body;

    // Get user profile
    const userProfile = await User.findById(userId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get recent analyses for context
    const recentAnalyses = await getRecentAnalyses(userId, 5);
    const recentMoodScores = recentAnalyses
      .filter(a => a.moodScore)
      .map(a => a.moodScore);

    const weeklyAvg = recentMoodScores.length > 0
      ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length
      : null;

    const lowMoodStreak = countLowMoodStreak(recentMoodScores);

    // Run AI analysis
    const analysis = await analyzeWellness({
      moodScore,
      moodNote,
      phq9Score,
      gad7Score,
      weeklyAvg,
      lowMoodStreak,
      recentScores: recentMoodScores.slice(0, 5),
      userName: userProfile.name || 'User'
    });

    // Get therapist recommendation if medium/high risk
    let therapistRecommendation = null;
    if (analysis.riskLevel !== 'LOW') {
      try {
        const therapists = await User.find({ role: 'therapist', 'therapistProfile.isVerified': true });
        if (therapists && therapists.length > 0) {
          therapistRecommendation = await getTherapistRecommendation(
            { ...analysis, phq9Score, gad7Score },
            therapists
          );
        }
      } catch (err) {
        console.log('Therapist recommendation skipped:', err.message);
      }
    }

    // Save analysis to DynamoDB
    const analysisItem = {
      userId,
      SK: `WELLNESS_ANALYSIS#${new Date().toISOString()}`,
      ...analysis,
      moodScore,
      phq9Score: phq9Score || null,
      gad7Score: gad7Score || null,
      triggerSource: triggerSource || 'MOOD',
      therapistRecommendation,
      analyzedAt: new Date().toISOString(),
      escalated: false,
    };

    await ddbDocClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: analysisItem
    }));

    // Evaluate risk and potentially escalate
    let escalationResult = { escalated: false };
    escalationResult = await evaluateAndEscalate(
      userId,
      analysisItem, // Pass the full analysisItem containing scores
      userProfile,
      recentAnalyses
    );

    // Update escalation status if sent
    if (escalationResult.escalated) {
      analysisItem.escalated = true;
      await ddbDocClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: analysisItem
      }));
    }

    res.json({
      success: true,
      data: {
        analysis,
        therapistRecommendation,
        escalation: escalationResult,
      }
    });
  } catch (error) {
    console.error('Wellness analysis error:', error);
    res.status(500).json({ success: false, message: 'Wellness analysis failed.' });
  }
});

// POST /api/wellness/chat
// Sage chatbot conversation
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    // Fetch verified therapists to pass as context
    let therapists = [];
    try {
      therapists = await User.find({ role: 'therapist', 'therapistProfile.isVerified': true })
        .select('name therapistProfile');
    } catch (dbErr) {
      console.error('Error fetching therapists for chatbot context:', dbErr.message);
    }

    const extendedContext = {
      ...(userContext || {}),
      therapists: therapists.map(t => ({
        name: t.name,
        specializations: t.therapistProfile?.specializations || [],
        experienceYears: t.therapistProfile?.experienceYears || 0,
        sessionPrice: t.therapistProfile?.sessionPrice || 0
      }))
    };

    const result = await getChatResponse(messages, extendedContext);

    res.json({
      success: true,
      data: {
        response: result.response,
        model: result.model,
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Chat failed.' });
  }
});

// GET /api/wellness/bedrock-status
// Test Bedrock model permissions and connection
router.get('/bedrock-status', authenticate, async (req, res) => {
  try {
    const { testBedrockConnection } = require('../utils/bedrockAI');
    const result = await testBedrockConnection();
    res.json(result);
  } catch (error) {
    console.error('Bedrock status diagnostic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/wellness/analyze-report
// RAG analysis on uploaded clinical PDF report
router.post('/analyze-report', authenticate, async (req, res) => {
  try {
    const { reportText, question } = req.body;
    if (!reportText || !question) {
      return res.status(400).json({ success: false, message: 'Report text and question are required.' });
    }

    const result = await analyzeReport(reportText, question);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Report analysis error:', error);
    res.status(500).json({ success: false, message: 'Report analysis failed.' });
  }
});

// GET /api/wellness/latest
// Get most recent wellness analysis for dashboard
router.get('/latest', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const analyses = await getRecentAnalyses(userId, 1);

    res.json({
      success: true,
      data: analyses.length > 0 ? analyses[0] : null
    });
  } catch (error) {
    console.error('Get latest analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analysis.' });
  }
});

// Helper: get recent analyses
async function getRecentAnalyses(userId, limit) {
  try {
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      KeyConditionExpression: 'userId = :uid AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':uid': userId,
        ':prefix': 'WELLNESS_ANALYSIS#'
      },
      ScanIndexForward: false,
      Limit: limit
    }));
    return result.Items || [];
  } catch (err) {
    console.log('getRecentAnalyses error:', err.message);
    return [];
  }
}

// Helper: count consecutive low mood days
function countLowMoodStreak(scores) {
  let count = 0;
  for (const score of scores) {
    if (score <= 4) count++;
    else break;
  }
  return count;
}

module.exports = router;
