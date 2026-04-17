/**
 * Voice Service
 * Parses user voice text and determines intent and action.
 */
const logger = require('../config/logger');
const db = require('../config/database');

class VoiceService {
  /**
   * Process voice command text
   */
  async processCommand(text, userId) {
    const input = text.toLowerCase();
    
    // Default response
    let intent = "UNKNOWN";
    let action = "ASK_CLARIFICATION";
    let data = {};
    let confidence = 0.5;

    // 1. Language Switching
    const langMatch = input.match(/switch to (tamil|telugu|kannada|bengali|hindi|marathi|urdu|english)/i);
    if (langMatch) {
      const langMap = {
        'tamil': 'ta',
        'telugu': 'te',
        'kannada': 'kn',
        'bengali': 'bn',
        'hindi': 'hi',
        'marathi': 'mr',
        'urdu': 'ur',
        'english': 'en'
      };
      const newLang = langMap[langMatch[1]];
      if (newLang) {
        await db.query('UPDATE users SET language = $1 WHERE id = $2', [newLang, userId]);
        return {
          intent: "CHANGE_LANGUAGE",
          action: "UPDATE_UI_LANGUAGE",
          data: { language: newLang, message: `Switching to ${langMatch[1]}` },
          confidence: 1.0
        };
      }
    }

    // 2. Symptom Checking / Triage
    if (input.includes('fever') || input.includes('pain') || input.includes('headache') || input.includes('stomach')) {
      const symptoms = [];
      if (input.includes('fever')) symptoms.push('fever');
      if (input.includes('headache')) symptoms.push('headache');
      if (input.includes('pain')) symptoms.push('pain');
      
      return {
        intent: "SYMPTOM_CHECK",
        action: "NAVIGATE_TRIAGE",
        data: { symptoms },
        confidence: 0.9
      };
    }

    // 3. Emergency
    if (input.includes('emergency') || input.includes('help me') || input.includes('sos') || input.includes('ambulant')) {
      return {
        intent: "EMERGENCY",
        action: "TRIGGER_SOS",
        data: { severity: "HIGH" },
        confidence: 0.95
      };
    }

    // 4. Find Doctor
    if (input.includes('doctor') || input.includes('hospital') || input.includes('clinic')) {
      return {
        intent: "FIND_DOCTOR",
        action: "GET_NEARBY_DOCTORS",
        data: {},
        confidence: 0.85
      };
    }

    // 5. Add Medicine (NLP Parsing)
    // Format: "Add tablet Paracetamol 2 doses at 8 PM"
    const medMatch = input.match(/add (?:tablet|medicine|pill)?\s*([a-z0-9\s]+?)\s*(\d+\s*doses?)?\s*at\s*(\d+\s*(?:pm|am|:|\d+))/i);
    if (medMatch || input.includes('add medicine') || input.includes('add tablet')) {
      const name = medMatch ? medMatch[1].trim() : "Unknown Medicine";
      const dosage = medMatch ? medMatch[2] || "1 dose" : "1 dose";
      const rawTime = medMatch ? medMatch[3].toLowerCase() : "09:00";
      
      // Convert PM/AM to 24h format
      let time = rawTime;
      if (rawTime.includes('pm')) {
        let hour = parseInt(rawTime);
        if (hour < 12) hour += 12;
        time = `${hour}:00`;
      } else if (rawTime.includes('am')) {
        let hour = parseInt(rawTime);
        if (hour === 12) hour = 0;
        time = `${hour.toString().padStart(2, '0')}:00`;
      }

      return {
        intent: "ADD_MEDICINE",
        action: "POST_MEDICINE",
        data: { name, dosage, time },
        confidence: 0.9
      };
    }

    return { intent, action, data, confidence };
  }
}

module.exports = new VoiceService();
