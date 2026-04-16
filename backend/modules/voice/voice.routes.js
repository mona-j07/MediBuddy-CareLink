/**
 * Voice Engine Module – Routes & Controller
 * POST /api/voice/process   – Process audio → intent → action
 * POST /api/voice/tts       – Text to speech
 * GET  /api/voice/languages – Supported languages
 */
const router     = require('express').Router();
const multer     = require('multer');
const { authenticate } = require('../../middleware/auth.middleware');
const controller = require('./voice.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/mpeg'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/process',   authenticate, upload.single('audio'), controller.processAudio);
router.post('/tts',       authenticate, controller.textToSpeech);
router.get('/languages',               controller.getSupportedLanguages);
router.post('/detect-language',        controller.detectLanguage);

module.exports = router;
