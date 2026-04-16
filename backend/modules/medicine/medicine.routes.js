/**
 * Medicine Tracker Module – Routes
 * GET    /api/medicine           – Get all medicines
 * POST   /api/medicine           – Add medicine
 * PUT    /api/medicine/:id       – Update medicine
 * DELETE /api/medicine/:id       – Delete medicine
 * POST   /api/medicine/:id/log   – Log dose taken/skipped
 * GET    /api/medicine/adherence – Get adherence stats
 */
const router     = require('express').Router();
const { body }   = require('express-validator');
const { authenticate } = require('../../middleware/auth.middleware');
const validate   = require('../../middleware/validate.middleware');
const c          = require('./medicine.controller');

router.get('/',                     authenticate, c.getMedicines);
router.post('/',
  authenticate,
  [
    body('name').notEmpty(),
    body('frequency').isIn(['once_daily','twice_daily','thrice_daily','as_needed']),
    body('times').isArray({ min: 1 }),
  ],
  validate,
  c.addMedicine
);
router.put('/:id',                  authenticate, c.updateMedicine);
router.delete('/:id',               authenticate, c.deleteMedicine);
router.post('/:id/log',             authenticate, c.logDose);
router.get('/adherence/:userId',    authenticate, c.getAdherence);
router.get('/reminders/today',      authenticate, c.getTodayReminders);

module.exports = router;
