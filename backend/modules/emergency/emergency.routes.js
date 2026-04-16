/**
 * Emergency SOS Module – Routes & Controller
 * POST /api/emergency/sos      – Trigger SOS
 * POST /api/emergency/cancel   – Cancel SOS
 * GET  /api/emergency/contacts – Get emergency contacts
 * PUT  /api/emergency/contacts – Update emergency contacts
 * GET  /api/emergency/history  – SOS history
 */
const router     = require('express').Router();
const { authenticate } = require('../../middleware/auth.middleware');
const controller = require('./emergency.controller');

router.post('/sos',           authenticate, controller.triggerSOS);
router.post('/cancel',        authenticate, controller.cancelSOS);
router.get('/contacts',       authenticate, controller.getContacts);
router.put('/contacts',       authenticate, controller.updateContacts);
router.get('/history',        authenticate, controller.getHistory);
router.get('/nearest-hospital', controller.getNearestHospital);

module.exports = router;
