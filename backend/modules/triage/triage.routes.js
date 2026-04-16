/**
 * AI Triage Module – Routes & Controller
 * POST /api/triage/analyze
 * GET  /api/triage/history/:userId
 * POST /api/triage/feedback
 */
const router     = require('express').Router();
const { body }   = require('express-validator');
const { authenticate } = require('../../middleware/auth.middleware');
const validate   = require('../../middleware/validate.middleware');
const controller = require('./triage.controller');

router.post('/analyze',
  authenticate,
  [
    body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom required'),
    body('age').isInt({ min: 1, max: 120 }),
    body('gender').isIn(['male', 'female', 'other']),
    body('severity').isInt({ min: 1, max: 10 }),
  ],
  validate,
  controller.analyze
);

router.get('/history/:userId',  authenticate, controller.getHistory);
router.post('/feedback',        authenticate, controller.submitFeedback);
router.get('/diseases',                       controller.getDiseaseList);

module.exports = router;
