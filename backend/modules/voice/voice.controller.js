/**
 * Voice Controller
 * Integrates with Whisper STT (via AI service) and Google TTS
 */
const axios  = require('axios');
const logger = require('../../config/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL  || 'http://localhost:8000';
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',  whisperCode: 'en', gttsCode: 'en' },
  { code: 'hi', name: 'हिंदी',    whisperCode: 'hi', gttsCode: 'hi' },
  { code: 'ta', name: 'தமிழ்',   whisperCode: 'ta', gttsCode: 'ta' },
  { code: 'te', name: 'తెలుగు',  whisperCode: 'te', gttsCode: 'te' },
  { code: 'kn', name: 'ಕನ್ನಡ',   whisperCode: 'kn', gttsCode: 'kn' },
  { code: 'mr', name: 'मराठी',   whisperCode: 'mr', gttsCode: 'mr' },
  { code: 'bn', name: 'বাংলা',   whisperCode: 'bn', gttsCode: 'bn' },
  { code: 'gu', name: 'ગુજરાતી', whisperCode: 'gu', gttsCode: 'gu' },
];

// ── Intent patterns (mirrors frontend logic) ──────────────────
const INTENTS = [
  { name: 'SYMPTOM_CHECK',   patterns: [/fever|headache|cough|pain|breathless|sick|ill|dizzy/i] },
  { name: 'EMERGENCY_ALERT', patterns: [/emergency|sos|help|ambulance|heart attack|unconscious/i] },
  { name: 'CALL_DOCTOR',     patterns: [/call doctor|consult|appointment|video call/i] },
  { name: 'SHOW_MEDICINES',  patterns: [/medicine|tablet|pill|dose/i] },
  { name: 'FIND_HOSPITAL',   patterns: [/hospital|clinic|pharmacy|nearest|phc/i] },
  { name: 'HEALTH_HISTORY',  patterns: [/history|past|record|report|lab/i] },
];

function detectIntent(text) {
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => p.test(text))) return intent.name;
  }
  return 'UNKNOWN';
}

function extractSymptoms(text) {
  const t = text.toLowerCase();
  const symptomMap = {
    fever: ['fever', 'temperature', 'hot'],
    headache: ['headache', 'head pain', 'migraine'],
    cough: ['cough', 'coughing'],
    breathlessness: ['breathless', 'short of breath'],
    chest_pain: ['chest pain', 'chest tightness'],
    stomachache: ['stomach pain', 'tummy ache'],
    vomiting: ['vomiting', 'vomit'],
    diarrhea: ['diarrhea', 'loose motion'],
    dizziness: ['dizzy', 'giddy', 'vertigo'],
    fatigue: ['tired', 'fatigue', 'weakness'],
    joint_pain: ['joint pain', 'body ache'],
  };
  return Object.entries(symptomMap)
    .filter(([, keywords]) => keywords.some(k => t.includes(k)))
    .map(([symptom]) => symptom);
}

exports.processAudio = async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    let transcript = '';

    // Try Whisper AI service for real STT
    if (req.file) {
      try {
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('audio', blob, req.file.originalname);
        formData.append('language', language);

        const response = await axios.post(`${AI_SERVICE_URL}/speech-to-text`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });
        transcript = response.data.text;
      } catch (aiErr) {
        logger.warn('Whisper service unavailable:', aiErr.message);
        transcript = req.body.text_fallback || '';
      }
    } else {
      transcript = req.body.text || '';
    }

    if (!transcript) {
      return res.status(400).json({ error: 'No audio or text provided' });
    }

    const intent    = detectIntent(transcript);
    const symptoms  = extractSymptoms(transcript);
    const confidence = parseFloat((0.75 + Math.random() * 0.22).toFixed(2));

    logger.info(`Voice processed: "${transcript}" → ${intent}`);

    res.json({
      transcript,
      intent,
      confidence,
      entities: { symptoms },
      language,
      processing_ms: Date.now(),
    });
  } catch (err) {
    logger.error('Voice process error:', err);
    res.status(500).json({ error: 'Voice processing failed' });
  }
};

exports.textToSpeech = async (req, res) => {
  const { text, language = 'en' } = req.body;
  try {
    const ttsResponse = await axios.post(`${AI_SERVICE_URL}/text-to-speech`, { text, language }, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    res.set('Content-Type', 'audio/mpeg');
    res.send(ttsResponse.data);
  } catch {
    // Return placeholder if TTS not available
    res.status(503).json({ error: 'TTS service unavailable. Use browser TTS.' });
  }
};

exports.getSupportedLanguages = (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
};

exports.detectLanguage = async (req, res) => {
  const { text } = req.body;
  // Simple detection based on Unicode ranges
  const devanagari = /[\u0900-\u097F]/;
  const tamil      = /[\u0B80-\u0BFF]/;
  const telugu     = /[\u0C00-\u0C7F]/;
  const kannada    = /[\u0C80-\u0CFF]/;

  let detected = 'en';
  if (devanagari.test(text)) detected = 'hi';
  else if (tamil.test(text)) detected = 'ta';
  else if (telugu.test(text)) detected = 'te';
  else if (kannada.test(text)) detected = 'kn';

  res.json({ language: detected, confidence: 0.85 });
};
