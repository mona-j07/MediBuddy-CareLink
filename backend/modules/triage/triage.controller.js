/**
 * Triage Controller
 * Calls Python AI microservice via HTTP or runs inline JS model
 */
const axios    = require('axios');
const { v4: uuidv4 } = require('uuid');
const TriageLog = require('./triage.model');
const logger   = require('../../config/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Triage Knowledge (fallback if AI service offline) ─────────
const DISEASE_RULES = [
  {
    name: 'Common Cold / Flu', keywords: ['fever','headache','cough','fatigue'],
    severity: 'green', confidence_base: 0.75,
    advice: ['Rest and hydrate', 'Paracetamol for fever', 'Warm liquids'],
  },
  {
    name: 'Dengue Fever', keywords: ['fever','headache','joint_pain','rash','eye_pain'],
    severity: 'yellow', confidence_base: 0.80,
    advice: ['Blood test required', 'No Aspirin/Ibuprofen', 'Monitor platelets'],
  },
  {
    name: 'Cardiac Emergency', keywords: ['chest_pain','breathlessness','dizziness','fatigue'],
    severity: 'red', confidence_base: 0.88,
    advice: ['Call 108 immediately', 'Do not exert', 'Loosen clothing'],
  },
  {
    name: 'Gastroenteritis', keywords: ['stomachache','vomiting','diarrhea','nausea'],
    severity: 'yellow', confidence_base: 0.82,
    advice: ['ORS solution', 'BRAT diet', 'Avoid spicy foods'],
  },
  {
    name: 'Respiratory Infection', keywords: ['cough','fever','breathlessness'],
    severity: 'yellow', confidence_base: 0.77,
    advice: ['Steam inhalation', 'Warm liquids', 'Monitor SpO2'],
  },
];

function runRuleEngine(symptoms, age, severity) {
  const symptomSet = new Set(symptoms);
  const scored = DISEASE_RULES.map(rule => {
    const matches = rule.keywords.filter(k => symptomSet.has(k)).length;
    const score   = matches / rule.keywords.length;
    let confidence = score * rule.confidence_base;

    // Age boost
    if (age > 60 && rule.severity === 'red')    confidence *= 1.3;
    if (age > 60 && rule.severity === 'yellow') confidence *= 1.15;
    // Severity boost
    confidence *= (1 + (severity - 5) * 0.04);
    confidence = Math.min(0.97, Math.max(0, parseFloat(confidence.toFixed(2))));

    return { name: rule.name, severity: rule.severity, confidence, advice: rule.advice, matches };
  });

  return scored
    .filter(d => d.confidence > 0.1)
    .sort((a,b) => b.confidence - a.confidence)
    .slice(0, 3);
}

exports.analyze = async (req, res) => {
  try {
    const { userId } = req.user;
    const { symptoms, age, gender, severity, vitals = {} } = req.body;

    let diseases;
    // Try AI microservice first
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/triage`, {
        symptoms, age, gender, severity, vitals,
      }, { timeout: 5000 });
      diseases = aiResponse.data.diseases;
    } catch (aiErr) {
      logger.warn('AI service unavailable, using rule engine fallback');
      diseases = runRuleEngine(symptoms, age, severity);
    }

    const primary   = diseases[0];
    const sessionId = uuidv4();

    // Log to MongoDB
    await TriageLog.create({
      sessionId,
      userId,
      symptoms,
      age,
      gender,
      severity,
      result: { primary: primary?.name, severity: primary?.severity, diseases },
      timestamp: new Date(),
    });

    const response = {
      sessionId,
      severity:   primary?.severity || 'green',
      confidence: Math.round((primary?.confidence || 0.5) * 100),
      primary:    primary?.name,
      diseases,
      firstAid:   primary?.advice || [],
      aiModel:    diseases.length ? 'rule-engine-v2' : 'none',
      disclaimer: 'This is AI-generated triage. Always consult a doctor for medical decisions.',
    };

    logger.info(`Triage: User=${userId} Symptoms=${symptoms.join(',')} → ${primary?.name} [${primary?.severity}]`);
    res.json(response);
  } catch (err) {
    logger.error('Triage error:', err);
    res.status(500).json({ error: 'Triage analysis failed' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const logs = await TriageLog.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-__v');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

exports.submitFeedback = async (req, res) => {
  const { sessionId, accurate, actualDiagnosis } = req.body;
  await TriageLog.findOneAndUpdate({ sessionId }, { feedback: { accurate, actualDiagnosis } });
  res.json({ message: 'Feedback recorded. Thank you!' });
};

exports.getDiseaseList = (req, res) => {
  res.json({
    diseases: DISEASE_RULES.map(d => ({
      name: d.name,
      severity: d.severity,
      symptoms: d.keywords,
    })),
  });
};
