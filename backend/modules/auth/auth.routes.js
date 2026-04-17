/**
 * Auth Module – Routes
 */
const router      = require('express').Router();
const controller  = require('./auth.controller');

router.post('/register',   controller.register);
router.post('/verify-otp', controller.verifyOTP);
router.post('/login',      controller.login);
router.post('/logout',     controller.logout);
router.post('/refresh',    controller.refresh);

module.exports = router;
