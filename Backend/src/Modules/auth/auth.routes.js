const router = require('express').Router();
const validate = require('../../middleware/validation');
const { authLimiter, otpEmailLimiter } = require('../../middleware/security');
const controller = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require('./auth.validation');

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/register/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyRegisterOtp);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/login/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyLoginOtp);
router.post('/forgot-password', authLimiter, otpEmailLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, otpEmailLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/logout', controller.logout);

module.exports = router;
