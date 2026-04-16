/**
 * Auth Module – Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * POST /api/auth/logout
 */
const router      = require('express').Router();
const { body }    = require('express-validator');
const controller  = require('./auth.controller');
const validate    = require('../../middleware/validate.middleware');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').isMobilePhone('en-IN').withMessage('Valid Indian mobile required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['CLIENT', 'CARETAKER', 'DOCTOR']).withMessage('Invalid role'),
  ],
  validate,
  controller.register
);

router.post('/login',
  [
    body('phone').notEmpty(),
    body('password').notEmpty(),
  ],
  validate,
  controller.login
);

router.post('/refresh', controller.refresh);
router.post('/logout',  controller.logout);
router.post('/request-otp', controller.requestOTP);
router.post('/verify-otp',  controller.verifyOTP);

module.exports = router;
