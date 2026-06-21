const {
  BedrockRuntimeClient,
  InvokeModelCommand,
  ConverseCommand
} = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// ─── PRIMARY: AMAZON NOVA LITE ────────────────────────

const callAmazonNova = async (systemPrompt, userMessage) => {
  const messages = [
    {
      role: 'user',
      content: [{ text: userMessage }]
    }
  ];

  const command = new ConverseCommand({
    modelId: 'amazon.nova-lite-v1:0',
    system: [{ text: systemPrompt }],
    messages: messages,
    inferenceConfig: {
      maxTokens: 500,
      temperature: 0.7,
      topP: 0.9
    }
  });

  const response = await bedrockClient.send(command);
  return response.output.message.content[0].text;
};

// ─── FALLBACK: AMAZON TITAN EXPRESS ──────────────────

const callAmazonTitan = async (prompt) => {
  const payload = {
    inputText: prompt,
    textGenerationConfig: {
      maxTokenCount: 500,
      temperature: 0.7,
      topP: 0.9,
      stopSequences: []
    }
  };

  const command = new InvokeModelCommand({
    modelId: 'amazon.titan-text-express-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.results[0].outputText.trim();
};

// ─── WELLNESS ANALYSIS ────────────────────────────────

const WELLNESS_SYSTEM_PROMPT = `You are a mental wellness AI for CalmRoot.
Analyze user wellness data and return ONLY valid JSON.
Never include markdown or explanations outside the JSON.`;

const analyzeWellness = async (userData) => {
  const userMessage = `
Analyze this wellness data and return JSON:
{
  "emotionalState": "string (one of: positive/neutral/low/distressed)",
  "sentimentScore": number (-1 to 1),
  "riskLevel": "string (LOW/MEDIUM/HIGH)",
  "riskScore": number (0-100),
  "stressLevel": "string (LOW/MEDIUM/HIGH)",
  "recurringThemes": ["array of detected themes"],
  "requiresEscalation": boolean,
  "escalationReason": "string or null",
  "suggestions": ["array of 3 actionable suggestions"],
  "therapistRecommendationReason": "string",
  "joke": "a short uplifting mental health friendly joke to lighten mood",
  "weeklyInsight": "personalized insight based on trends"
}

User Data:
- Current mood score: ${userData.moodScore}/10
- Mood note: "${userData.moodNote || 'none'}"
- PHQ-9 score: ${userData.phq9Score || 'not taken'} (depression, 0-27)
- GAD-7 score: ${userData.gad7Score || 'not taken'} (anxiety, 0-21)
- Last 7 days mood average: ${userData.weeklyAvg || 'unknown'}
- Consecutive low mood days: ${userData.lowMoodStreak || 0}
- Last 5 mood scores: ${JSON.stringify(userData.recentScores || [])}
- User name: ${userData.userName}

Scoring context:
- PHQ-9: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 mod-severe, 20+ severe
- GAD-7: 0-4 minimal, 5-9 mild, 10-14 moderate, 15+ severe
- Mood: 1-3 very low, 4-5 low, 6-7 neutral, 8-9 good, 10 excellent

Return ONLY valid JSON object.`;

  try {
    const response = await callAmazonNova(WELLNESS_SYSTEM_PROMPT, userMessage);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(response);
  } catch (error) {
    console.log('Nova failed, trying Titan:', error.message);
    try {
      const fullPrompt = `${WELLNESS_SYSTEM_PROMPT}\n\n${userMessage}`;
      const response = await callAmazonTitan(fullPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (titanError) {
      console.log('Titan also failed:', titanError.message);
    }
    // Safe default response
    return {
      emotionalState: 'neutral',
      sentimentScore: 0,
      riskLevel: 'LOW',
      riskScore: 20,
      stressLevel: 'LOW',
      recurringThemes: [],
      requiresEscalation: false,
      escalationReason: null,
      suggestions: [
        'Take a few deep breaths and practice mindfulness',
        'Consider journaling your thoughts today',
        'Reach out to a trusted friend or therapist'
      ],
      therapistRecommendationReason: 'Regular check-ins help maintain wellness',
      joke: 'Why did the brain go to therapy? Because it had too many thoughts! 🧠',
      weeklyInsight: 'Keep tracking your mood daily for better insights.'
    };
  }
};

// ─── CHATBOT CONVERSATION ─────────────────────────────

const SAGE_SYSTEM_PROMPT = `You are Sage, CalmRoot's AI wellness companion.
CalmRoot is a mental health platform with 50+ verified therapists.

PERSONALITY: Warm, friendly, insightful. Like a knowledgeable caring friend.
Use 1-2 emojis max per message. Keep responses under 100 words usually.
Always end with a question to continue the conversation.

CAPABILITIES:
- Emotional check-ins and active listening
- Mood pattern insights
- Coping techniques (breathing, grounding, journaling)
- Therapist recommendations
- App navigation help
- Light humor to lift mood when appropriate

SAFETY & SCOPE (NON-NEGOTIABLE):
- NEVER diagnose any condition
- NEVER replace professional therapy
- Crisis keywords (self-harm/suicide): IMMEDIATELY provide:
  "I hear you. Please call iCall now: 9152987821 💙"
- Always recommend therapists for serious concerns
- STRICT SCOPE LIMIT: You must ONLY discuss mental wellness, emotional support, stress, mindfulness, coping strategies, therapist directory/recommendations, and CalmRoot features.
- THERAPIST INFORMATION: You have access to a list of available verified therapists on CalmRoot in the context below. You are fully expected and authorized to list their names, specialties, and experience when the user asks about them or seeks a therapist recommendation.
- If the user asks about general knowledge, history, sports, coding, math, science, politics, pop culture, or any other topic unrelated to mental wellness, therapy, and CalmRoot, you MUST politely decline to answer and redirect them back to a wellness check-in. Do not answer off-topic questions.
  - Example refusal: "I'm here to support your mental wellness and guide you through CalmRoot. I can't help with other topics, but I'd love to hear how you are feeling today! 🌿"

RESPONSE STYLE:
- Natural, varied openings
- Concise (2-4 sentences)
- Proactively reference user data when available`;

const getChatResponse = async (messages, userContext = {}) => {
  const contextNote = userContext ? `
[Context: Streak: ${userContext.streakDays || 0} days, 
Mood score: ${userContext.recentMoodScore || 'not logged'},
Risk level: ${userContext.riskLevel || 'unknown'},
Upcoming session: ${userContext.hasUpcomingSession ? 'Yes' : 'No'},
Recommended therapist: ${userContext.recommendedTherapist || 'not set'}]` : '';

  let therapistNote = '';
  if (userContext.therapists && userContext.therapists.length > 0) {
    therapistNote = `\n\nVerified Therapists available on CalmRoot:
${userContext.therapists.map(t => `- ${t.name} (Specializations: ${t.specializations.join(', ')}, Experience: ${t.experienceYears} years, Session Price: ₹${t.sessionPrice})`).join('\n')}`;
  }

  const systemWithContext = SAGE_SYSTEM_PROMPT + contextNote + therapistNote;

  // Filter and format messages for Bedrock Converse API:
  // 1. Must start with a 'user' message.
  // 2. Roles must alternate between 'user' and 'assistant'.
  // 3. Must not have empty content.
  const formattedMessages = [];
  for (const msg of messages) {
    if (!msg.content || typeof msg.content !== 'string' || msg.content.trim() === '') {
      continue;
    }
    const role = msg.role === 'user' ? 'user' : 'assistant';
    
    if (formattedMessages.length === 0) {
      if (role !== 'user') {
        // Skip leading non-user message
        continue;
      }
    } else {
      // Alternate check: if same role, merge content
      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (lastMsg.role === role) {
        lastMsg.content[0].text += '\n' + msg.content.trim();
        continue;
      }
    }
    
    formattedMessages.push({
      role: role,
      content: [{ text: msg.content.trim() }]
    });
  }

  // Ensure there is at least one message to avoid API error
  if (formattedMessages.length === 0) {
    formattedMessages.push({
      role: 'user',
      content: [{ text: 'Hello' }]
    });
  }

  try {
    const command = new ConverseCommand({
      modelId: 'amazon.nova-lite-v1:0',
      system: [{ text: systemWithContext }],
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens: 300,
        temperature: 0.8,
        topP: 0.9
      }
    });
    const response = await bedrockClient.send(command);
    return {
      response: response.output.message.content[0].text,
      model: 'amazon-nova-lite'
    };
  } catch (error) {
    console.error('Nova chat failed, using Titan:', error);
    try {
      const conversation = formattedMessages
        .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content[0].text}`)
        .join('\n');
      const prompt = `${systemWithContext}\n\n${conversation}\nAssistant:`;
      const response = await callAmazonTitan(prompt);
      return { response, model: 'amazon-titan-express' };
    } catch (e) {
      console.error('Titan chat also failed:', e);
      return {
        response: `I'm having a moment 🌿 Please try again shortly! (Error: ${error.message || 'Unknown'})`,
        model: 'fallback'
      };
    }
  }
};

// ─── THERAPIST RECOMMENDATION ─────────────────────────

const getTherapistRecommendation = async (userAnalysis, therapistList) => {
  const systemPrompt = `You are a therapist matching AI for CalmRoot.
Return ONLY a JSON object with your recommendation.`;

  const userMessage = `
Based on this user's wellness data, recommend the best therapist.

User Analysis:
- Risk level: ${userAnalysis.riskLevel}
- Emotional state: ${userAnalysis.emotionalState}
- Recurring themes: ${JSON.stringify(userAnalysis.recurringThemes)}
- PHQ-9 score: ${userAnalysis.phq9Score || 'unknown'}
- GAD-7 score: ${userAnalysis.gad7Score || 'unknown'}

Available Therapists:
${JSON.stringify(therapistList.map(t => ({
  id: t._id || t.userId,
  name: t.name,
  specializations: t.therapistProfile?.specializations,
  experience: t.therapistProfile?.experienceYears,
  isVerified: t.therapistProfile?.isVerified
})))}

Return JSON:
{
  "recommendedTherapistId": "userId string",
  "recommendedTherapistName": "name string",
  "reason": "brief explanation why this therapist matches",
  "alternativeId": "second choice userId",
  "urgency": "ROUTINE/SOON/URGENT"
}`;

  try {
    const response = await callAmazonNova(systemPrompt, userMessage);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Therapist recommendation failed:', error);
  }

  // Return first verified therapist as fallback
  const verified = therapistList.find(t => t.therapistProfile?.isVerified);
  return verified ? {
    recommendedTherapistId: verified._id || verified.userId,
    recommendedTherapistName: verified.name,
    reason: 'Verified therapist available to help',
    urgency: 'ROUTINE'
  } : null;
};

// ─── DIAGNOSTIC CONNECTION CHECK ─────────────────────

const testBedrockConnection = async () => {
  try {
    console.log('Testing connection to Amazon Nova Lite (amazon.nova-lite-v1:0)...');
    const response = await callAmazonNova('You are a helpful test bot.', 'Ping');
    return {
      success: true,
      message: 'Nova Lite connection successful.',
      response
    };
  } catch (novaError) {
    console.error('Diagnostic Nova Lite failed:', novaError);
    try {
      console.log('Testing fallback to Amazon Titan Text Express (amazon.titan-text-express-v1)...');
      const response = await callAmazonTitan('System: Test\nHuman: Ping\nAssistant:');
      return {
        success: false,
        error: `Nova Lite failed: ${novaError.message}. Titan Text Express connection was successful. Check model permissions in AWS console.`,
        novaError: { message: novaError.message, code: novaError.code, name: novaError.name },
        titanResponse: response
      };
    } catch (titanError) {
      console.error('Diagnostic Titan failed:', titanError);
      return {
        success: false,
        error: `Both Nova Lite and Titan Express failed. Access issue or incorrect IAM credentials/region.`,
        novaError: { message: novaError.message, code: novaError.code, name: novaError.name },
        titanError: { message: titanError.message, code: titanError.code, name: titanError.name }
      };
    }
  }
};

// ─── RAG REPORT ANALYSIS ──────────────────────────────

const analyzeReport = async (reportText, question) => {
  const systemPrompt = `You are a medical report analyst for CalmRoot. 
You are given the clinical notes/report of a therapy session.
Your task is to summarize the report and answer the user's questions about follow-up actions, coping strategies, or session details.
Be warm, compassionate, and professional. Avoid diagnosing or prescribing treatments.
Keep your response under 150 words.

STRICT SCOPE & VALIDATION RESTRICTION:
- You must ONLY analyze clinical reports, therapy session notes, or wellness summaries.
- Before answering, inspect the "Clinical Report Content". If the content does not contain clinical notes, therapy summaries, session transcripts, client mental state assessments, or wellness reports (e.g. if it is a general document like a coding cheatsheet, math textbook, code repository guide, marketing manual, etc.), you MUST decline to analyze it.
- If the document is invalid/off-topic, or if the user's question is unrelated to therapy notes or mental wellness, you MUST respond EXACTLY with:
  "This document does not appear to be a clinical report or session summary. I can only analyze wellness reports and therapy notes for CalmRoot. 🌿"`;

  const userMessage = `
Clinical Report Content:
"""
${reportText}
"""

User Question: "${question}"

Provide a direct, helpful response based on the report content.`;

  try {
    const response = await callAmazonNova(systemPrompt, userMessage);
    return {
      response,
      model: 'amazon-nova-lite'
    };
  } catch (error) {
    console.error('Nova analyzeReport failed, trying Titan:', error);
    try {
      const prompt = `System: ${systemPrompt}\n\nHuman: ${userMessage}\nAssistant:`;
      const response = await callAmazonTitan(prompt);
      return {
        response,
        model: 'amazon-titan-express'
      };
    } catch (e) {
      console.error('Titan analyzeReport also failed:', e);
      throw e;
    }
  }
};

module.exports = {
  analyzeWellness,
  getChatResponse,
  getTherapistRecommendation,
  testBedrockConnection,
  analyzeReport
};
