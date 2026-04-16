/**
 * Analytics & Outbreak Detection – Routes
 */
const router     = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const c          = require('./analytics.controller');

router.get('/community/stats',      authenticate, c.getCommunityStats);
router.get('/outbreak/detect',      authenticate, c.detectOutbreaks);
router.get('/disease/trends',       authenticate, c.getDiseaseTrends);
router.get('/village/:villageId',   authenticate, c.getVillageHealth);
router.post('/report-case',         authenticate, c.reportCommunityCase);
router.get('/dashboard',            authenticate, authorize('doctor','chw','admin'), c.getDashboard);

module.exports = router;
