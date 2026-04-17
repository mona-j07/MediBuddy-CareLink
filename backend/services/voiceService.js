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
    'ASK_CONFIRM_DELETE_MED': 'இந்த மருந்தை நீக்கவா?',
    'ASK_CONFIRM_DELETE_MSG': 'இந்தச் செய்தியை நீக்கவா?',
    'DIAGNOSIS_RESULT': 'உங்கள் அறிகுறிகளின் அடிப்படையில், இது வைரஸ் காய்ச்சலாக இருக்கலாம்.',
    'NOT_SURE': 'எனக்கு உறுதியாக தெரியவில்லை. அருகிலுள்ள மருத்துவரிடம் உங்களை இணைக்கவா?'
  },
  'hi': {
    'ASK_FOLLOWUP_FEVER': 'आपको बुखार कब से है?',
    'ASK_FOLLOWUP_PAIN': 'क्या दर्द गंभीर है या हल्का?',
    'ASK_FOLLOWUP_BREATH': 'क्या आपको सांस लेने में तकलीफ महसूस होती है?',
    'ASK_CONFIRM_DOCTOR': 'क्या मैं डॉक्टर को कॉल करूं?',
    'ASK_CONFIRM_SOS': 'क्या आप चाहते हैं कि मैं आपातकालीन सेवाओं को कॉल करूं?',
    'ASK_CONFIRM_DELETE_MED': 'क्या आप इस दवा को हटाना चाहते हैं?',
    'ASK_CONFIRM_DELETE_MSG': 'क्या आप इस संदेश को हटाना चाहते हैं?',
    'DIAGNOSIS_RESULT': 'आपके लक्षणों के आधार पर, यह वायरल बुखार हो सकता है.',
    'NOT_SURE': 'मैं पूरी तरह से आश्वस्त नहीं हूं. क्या मैं आपको पास के डॉक्टर से जोड़ूं?'
  },
  'en': {
    'ASK_FOLLOWUP_FEVER': 'Since when do you have this fever?',
    'ASK_FOLLOWUP_PAIN': 'Is the pain severe or mild?',
    'ASK_FOLLOWUP_BREATH': 'Do you feel breathlessness?',
    'ASK_CONFIRM_DOCTOR': 'Shall I call a doctor?',
    'ASK_CONFIRM_SOS': 'Do you want me to call emergency services?',
    'ASK_CONFIRM_DELETE_MED': 'Do you want to delete this medicine?',
    'ASK_CONFIRM_DELETE_MSG': 'Do you want to delete this message?',
    'DIAGNOSIS_RESULT': 'Based on your symptoms, this may be viral fever.',
    'NOT_SURE': 'I am not fully sure. Shall I connect you to a nearby doctor?'
  }
};

class VoiceService {
  constructor() {
    this.sessions = {};
  }

  async processCommand(text, userId) {
    const input = text.toLowerCase();
    const session = this.getSession(userId);
    
    if (this.containsTamil(text)) session.lang = 'ta';
    else if (this.containsHindi(text)) session.lang = 'hi';
    const lang = session.lang || 'en';

    // ── Handle Conversation States ────────────────────────
    if (session.state === 'AWAITING_CONFIRM_SOS') {
      if (input.includes('yes') || input.includes('han') || input.includes('am') || input.includes('confirm')) {
        session.state = 'IDLE';
        return { intent: "SOS_CONFIRMED", action: "TRIGGER_SOS", data: { severity: "HIGH" } };
      }
    }

    if (session.state === 'AWAITING_CONFIRM_DELETE_MED') {
      if (input.includes('yes') || input.includes('han') || input.includes('am') || input.includes('confirm')) {
        session.state = 'IDLE';
        return { intent: "DELETE_CONFIRMED", action: "DELETE_BY_VOICE", data: { type: 'medicine' } };
      }
      session.state = 'IDLE';
      return { intent: "CANCELLED", action: "SPEAK", data: { text: "Cancelled." } };
    }

    if (session.state === 'AWAITING_FOLLOWUP_1') {
      session.answers.push(text); session.state = 'AWAITING_FOLLOWUP_2';
      return this.respond(lang, 'ASK_FOLLOWUP_PAIN', 'SPEAK_AND_LISTEN');
    }
    if (session.state === 'AWAITING_FOLLOWUP_2') {
      session.answers.push(text); session.state = 'AWAITING_FOLLOWUP_3';
      return this.respond(lang, 'ASK_FOLLOWUP_BREATH', 'SPEAK_AND_LISTEN');
    }
    if (session.state === 'AWAITING_FOLLOWUP_3') {
      session.answers.push(text); session.state = 'FINISHED';
      return this.respond(lang, 'DIAGNOSIS_RESULT', 'SHOW_RESULT', { condition: "Viral Fever" });
    }

    // ── Handle Confirmation States ────────────────────────
    if (session.state === 'AWAITING_CONFIRM_DOCTOR') {
      if (input.includes('yes') || input.includes('han') || input.includes('am') || input.includes('confirm')) {
        session.state = 'IDLE';
        return { intent: "CONFIRMED", action: "GET_NEARBY_DOCTORS", data: {} };
      }
      session.state = 'IDLE';
      return { intent: "CANCELLED", action: "SPEAK", data: { text: "Okay." } };
    }

    // ── Intent Detection ──────────────────────────────────
    if (input.includes('delete') && (input.includes('medicine') || input.includes('tablet'))) {
      session.state = 'AWAITING_CONFIRM_DELETE_MED';
      return this.respond(lang, 'ASK_CONFIRM_DELETE_MED', 'SPEAK_AND_LISTEN');
    }

    if (input.includes('fever') || input.includes('pain') || input.includes('headache') || input.includes('காய்ச்சல்')) {
      session.state = 'AWAITING_FOLLOWUP_1';
      session.answers = [text];
      return this.respond(lang, 'ASK_FOLLOWUP_FEVER', 'SPEAK_AND_LISTEN');
    }

    if (input.includes('doctor') || input.includes('call') || input.includes('டாக்டர்')) {
      session.state = 'AWAITING_CONFIRM_DOCTOR';
      return this.respond(lang, 'ASK_CONFIRM_DOCTOR', 'SPEAK_AND_LISTEN');
    }

    if (input.includes('emergency') || input.includes('sos') || input.includes('help')) {
      session.state = 'AWAITING_CONFIRM_SOS';
      return this.respond(lang, 'ASK_CONFIRM_SOS', 'SPEAK_AND_LISTEN');
    }

    return { intent: "UNKNOWN", action: "SPEAK", data: { text: "How can I help you?" }, confidence: 0.5 };
  }

  getSession(userId) {
    if (!this.sessions[userId]) this.sessions[userId] = { state: 'IDLE', answers: [], lang: 'en' };
    return this.sessions[userId];
  }

  respond(lang, key, action, data = {}) {
    const text = (TRANSLATIONS[lang] || TRANSLATIONS['en'])[key];
    return { intent: "CONVERSATIONAL", action, data: { ...data, text }, confidence: 1.0 };
  }

  containsTamil(text) { return /[\u0B80-\u0BFF]/.test(text); }
  containsHindi(text) { return /[\u0900-\u097F]/.test(text); }
}

module.exports = new VoiceService();
