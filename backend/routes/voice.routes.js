/**
 * Voice Command Routes
 */
const router = require('express').Router();
const voiceController = require('../controllers/voiceController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/command', verifyToken, voiceController.processVoiceCommand);

module.exports = router;
