const { sendEmergencyAlert } = require('./emailService');

// Risk calculation constants
const RISK_THRESHOLDS = {
  ESCALATION_COOLDOWN_HOURS: 48,
  HIGH_RISK_SCORE: 70,
};

const evaluateAndEscalate = async (
  userId,
  analysisResult,
  userProfile,
  recentAnalyses
) => {
  const emergencyContact = userProfile.emergencyContact;
  if (!emergencyContact?.email || !emergencyContact?.consentGiven) {
    return { escalated: false, reason: 'No emergency contact or no consent' };
  }

  // Trigger alert if:
  // 1. AI flagged requiresEscalation AND riskScore is high
  // 2. Instant Trigger: Mood score is <= 3 AND either risk level is HIGH or a clinical assessment (PHQ-9 or GAD-7) is severe (score >= 15)
  const moodScore = analysisResult.moodScore;
  const isSevereMood = moodScore !== null && moodScore !== undefined && Number(moodScore) <= 3;
  const isSevereAssessment = 
    (analysisResult.phq9Score !== null && Number(analysisResult.phq9Score) >= 15) || 
    (analysisResult.gad7Score !== null && Number(analysisResult.gad7Score) >= 15);

  const aiFlaggedEscalation = analysisResult.requiresEscalation && (analysisResult.riskScore >= RISK_THRESHOLDS.HIGH_RISK_SCORE);
  const instantTriggerMatched = isSevereMood && (analysisResult.riskLevel === 'HIGH' || isSevereAssessment);

  const shouldEscalate = aiFlaggedEscalation || instantTriggerMatched;

  if (!shouldEscalate) {
    return { 
      escalated: false, 
      reason: `Escalation criteria not met. (AI flag: ${aiFlaggedEscalation}, Instant severe trigger: ${instantTriggerMatched})` 
    };
  }

  // Check cooldown period to prevent spamming
  const lastEscalation = findLastEscalation(recentAnalyses || []);
  if (lastEscalation) {
    const hoursSince = (Date.now() - new Date(lastEscalation).getTime()) / 3600000;
    if (hoursSince < RISK_THRESHOLDS.ESCALATION_COOLDOWN_HOURS) {
      return { escalated: false, reason: `Cooldown active (${Math.round(hoursSince)}h / ${RISK_THRESHOLDS.ESCALATION_COOLDOWN_HOURS}h)` };
    }
  }

  // All conditions met — send alert
  const emailResult = await sendEmergencyAlert({
    contactName: emergencyContact.name,
    contactEmail: emergencyContact.email,
    userName: userProfile.name,
    userFirstName: userProfile.name.split(' ')[0],
    relationship: emergencyContact.relationship || 'trusted contact',
    riskLevel: analysisResult.riskLevel || 'HIGH',
  });

  return {
    escalated: emailResult.success,
    emailSentTo: emergencyContact.email,
    reason: aiFlaggedEscalation ? 'AI detected high risk over threshold' : 'Instant severe mood/assessment trigger matched',
    error: emailResult.error || null,
  };
};

const findLastEscalation = (analyses) => {
  for (const analysis of analyses) {
    if (analysis.escalated) return analysis.analyzedAt;
  }
  return null;
};

module.exports = { evaluateAndEscalate };
