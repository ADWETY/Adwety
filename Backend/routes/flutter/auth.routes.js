'use strict';

const router = require('express').Router();
const validate = require('../../middleware/validation');
const auth = require('../../middleware/auth');
const controller = require('../../controllers/flutter');
const authController = require('../../controllers/auth.controller');
const {
  registrationLimiters,
  loginLimiter,
  mfaLimiter,
  refreshLimiter
} = require('../../middleware/auth-rate-limiters');

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
});

router.post('/login', loginLimiter, validate(controller.loginSchema), controller.login);
router.post('/register', ...registrationLimiters, validate(controller.registerSchema), controller.register);
router.post('/auth/login', loginLimiter, validate(controller.loginSchema), controller.login);
router.post('/auth/register', ...registrationLimiters, validate(controller.registerSchema), controller.register);
router.post('/auth/mfa/verify', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaAuto);
router.post('/auth/mfa/setup/verify', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaSetup);
router.post('/auth/refresh', refreshLimiter, validate(authController.refreshSchema), authController.refresh);
router.post('/auth/logout', auth.optionalLenient, validate(authController.logoutSchema), authController.logout);
router.post('/auth/logout-all', auth, authController.logoutAll);

module.exports = router;
