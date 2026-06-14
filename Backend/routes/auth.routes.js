'use strict';

const router = require('express').Router();
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');
const controller = require('../controllers/auth.controller');
const {
  registrationLimiters,
  loginLimiter,
  mfaLimiter,
  refreshLimiter,
  forgotPairLimiter,
  forgotAccountLimiter,
  otpRequestLimiter
} = require('../middleware/auth-rate-limiters');

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
});

router.post('/register', ...registrationLimiters, validate(controller.registerSchema), controller.register);
router.post('/register/verify-otp', otpRequestLimiter, controller.verifyRegisterOtp);
router.post('/login', loginLimiter, validate(controller.loginSchema), controller.login);
router.post('/login/verify-otp', mfaLimiter, validate(controller.mfaVerifySchema), controller.verifyMfaLogin);
router.post('/mfa/login/verify', mfaLimiter, validate(controller.mfaVerifySchema), controller.verifyMfaLogin);
router.post('/mfa/setup/verify', mfaLimiter, validate(controller.mfaVerifySchema), controller.verifyMfaSetup);
router.post('/mfa/reauth', auth, auth.authorize(['admin']), mfaLimiter, validate(controller.mfaReauthSchema), controller.reauthMfa);
router.post('/forgot-password', forgotPairLimiter, forgotAccountLimiter, validate(controller.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', otpRequestLimiter, validate(controller.resetPasswordSchema), controller.resetPassword);
router.post('/refresh', refreshLimiter, validate(controller.refreshSchema), controller.refresh);
router.post('/logout', auth.optionalLenient, validate(controller.logoutSchema), controller.logout);
router.post('/logout-all', auth, controller.logoutAll);
router.get('/me', auth, controller.me);

module.exports = router;
