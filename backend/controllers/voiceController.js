/**
 * Voice Controller
 */
const voiceService = require('../services/voiceService');
const translationService = require('../services/translationService');
const User = require('../models/User');
const logger = require('../config/logger');

const processVoiceCommand = async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;

  if (!text) {
    return res.status(400).json({ error: 'Text command is required' });
  }

  try {
    const user = await User.findById(userId);
    const userLang = user.language || 'en';

    // 1. Process command for intent/action
    const result = await voiceService.processCommand(text, userId);

    // 2. If result has a message or needs translation, translate it
    if (result.data && result.data.message) {
      result.data.message = await translationService.translate(result.data.message, userLang);
    }

    // Add confidence scoring if not present
    if (!result.confidence) result.confidence = 0.85;

    res.json(result);
  } catch (error) {
    logger.error('Error processing voice command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  processVoiceCommand
};
