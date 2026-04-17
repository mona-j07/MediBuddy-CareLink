/**
 * Voice Service (Intelligent Multilingual version)
 * Parses user voice text, manages conversation context, and handles multi-language flow.
 */
const logger = require('../config/logger');
const db = require('../config/database');

// Simple dictionary for multilingual responses (Demo/MVP level)
const TRANSLATIONS = {
  'ta': {
    'ASK_FOLLOWUP_FEVER': 'உங்களுக்கு காய்ச்சல் எப்போது தொடங்கியது?',
    'ASK_FOLLOWUP_PAIN': 'வலி கடுமையாக இருக்கிறதா அல்லது லேசானதா?',
    'ASK_FOLLOWUP_BREATH': 'மூச்சுத் திணறல் இருக்கிறதா?',
    'ASK_CONFIRM_DOCTOR': 'நான் டாக்டரை அழைக்கவா?',
    'ASK_CONFIRM_SOS': 'அவசர சேவைகளை அழைக்க வேண்டுமா?',
    'DIAGNOSIS_RESULT': 'உங்கள் அறிகுறிகளின் அடிப்படையில், இது வைரஸ் காய்ச்சலாக இருக்கலாம்.',
    'NOT_SURE': 'எனக்கு உறுதியாக தெரியவில்லை. அருகிலுள்ள மருத்துவரிடம் உங்களை இணைக்கவா?'
  },
  'hi': {
    'ASK_FOLLOWUP_FEVER': 'आपको बुखार कब से है?',
    'ASK_FOLLOWUP_PAIN': 'क्या दर्द गंभीर है या हल्का?',
    'ASK_FOLLOWUP_BREATH': 'क्या आपको सांस लेने में तकलीफ महसूस होती है?',
    'ASK_CONFIRM_DOCTOR': 'क्या मैं डॉक्टर को कॉल करूं?',
    'ASK_CONFIRM_SOS': 'क्या आप चाहते हैं कि मैं आपातकालीन सेवाओं को कॉल करूं?',
    'DIAGNOSIS_RESULT': 'आपके लक्षणों के आधार पर, यह वायरल बुखार हो सकता है.',
    'NOT_SURE': 'मैं पूरी तरह से आश्वस्त नहीं हूं. क्या मैं आपको पास के डॉक्टर से जोड़ूं?'
  },
  'en': {
    'ASK_FOLLOWUP_FEVER': 'Since when do you have this fever?',
    'ASK_FOLLOWUP_PAIN': 'Is the pain severe or mild?',
    'ASK_FOLLOWUP_BREATH': 'Do you feel breathlessness?',
    'ASK_CONFIRM_DOCTOR': 'Shall I call a doctor?',
    'ASK_CONFIRM_SOS': 'Do you want me to call emergency services?',
    'DIAGNOSIS_RESULT': 'Based on your symptoms, this may be viral fever.',
    'NOT_SURE': 'I am not fully sure. Shall I connect you to a nearby doctor?'
  }
};

class VoiceService {
  constructor() {
    // In-memory session store (In production, use Redis or Postgres sessionStorage)
    this.sessions = {};
  }

  /**
   * Process voice command text
   */
  async processCommand(text, userId) {
    const input = text.toLowerCase();
    const session = this.getSession(userId);
    const userLang = session.lang || 'en';
    
    // 1. Language Detection & Switching (Basic detection)
    if (this.containsTamil(text)) session.lang = 'ta';
    else if (this.containsHindi(text)) session.lang = 'hi';
    
    const lang = session.lang;

    // 2. Handle Existing Conversation State (Diagnosis Flow)
    if (session.state === 'AWAITING_FOLLOWUP_1') {
      session.answers.push(text);
      session.state = 'AWAITING_FOLLOWUP_2';
      return this.respond(lang, 'ASK_FOLLOWUP_PAIN', 'SPEAK_AND_LISTEN');
    }
    if (session.state === 'AWAITING_FOLLOWUP_2') {
      session.answers.push(text);
      session.state = 'AWAITING_FOLLOWUP_3';
      return this.respond(lang, 'ASK_FOLLOWUP_BREATH', 'SPEAK_AND_LISTEN');
    }
    if (session.state === 'AWAITING_FOLLOWUP_3') {
      session.answers.push(text);
      session.state = 'FINISHED';
      // Process all answers here with AI...
      return this.respond(lang, 'DIAGNOSIS_RESULT', 'SHOW_RESULT', { 
        condition: "Viral Fever", confidence: 0.85, severity: "MEDIUM" 
      });
    }

    // 3. Handle Confirmations
    if (session.state === 'AWAITING_CONFIRM_DOCTOR') {
      if (input.includes('yes') || input.includes('am') || input.includes('han') || input.includes('confirm')) {
        session.state = 'IDLE';
        return { intent: "CONFIRMED", action: "GET_NEARBY_DOCTORS", data: {} };
      }
      session.state = 'IDLE';
      return { intent: "CANCELLED", action: "SPEAK", data: { text: "Okay, I will not call." } };
    }

    // 4. Initial Intent Detection
    // Triage Trigger
    if (input.includes('fever') || input.includes('pain') || input.includes('headache') || input.includes('காய்ச்சல்')) {
      session.state = 'AWAITING_FOLLOWUP_1';
      session.answers = [text];
      return this.respond(lang, 'ASK_FOLLOWUP_FEVER', 'SPEAK_AND_LISTEN');
    }

    // Call Doctor Trigger
    if (input.includes('doctor') || input.includes('call') || input.includes('டாக்டர்')) {
      session.state = 'AWAITING_CONFIRM_DOCTOR';
      return this.respond(lang, 'ASK_CONFIRM_DOCTOR', 'SPEAK_AND_LISTEN');
    }

    // Emergency Trigger
    if (input.includes('emergency') || input.includes('help me') || input.includes('sos') || input.includes('can\'t breathe')) {
      session.state = 'AWAITING_CONFIRM_SOS';
      return this.respond(lang, 'ASK_CONFIRM_SOS', 'SPEAK_AND_LISTEN');
    }

    return { 
      intent: "UNKNOWN", 
      action: "SPEAK", 
      data: { text: "I'm listening. How can I help you today?" }, 
      confidence: 0.5 
    };
  }

  getSession(userId) {
    if (!this.sessions[userId]) {
      this.sessions[userId] = { state: 'IDLE', answers: [], lang: 'en' };
    }
    return this.sessions[userId];
  }

  respond(lang, key, action, data = {}) {
    const text = (TRANSLATIONS[lang] || TRANSLATIONS['en'])[key];
    return {
      intent: "CONVERSATIONAL",
      action: action,
      data: { ...data, text },
      confidence: 1.0
    };
  }

  containsTamil(text) {
    const tamilPattern = /[\u0B80-\u0BFF]/;
    return tamilPattern.test(text);
  }

  containsHindi(text) {
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text);
  }
}

module.exports = new VoiceService();

module.exports = new VoiceService();
