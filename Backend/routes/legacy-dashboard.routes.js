const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const upload = require('../middleware/upload');
const controller = require('../controllers/legacy-dashboard.controller');
const authController = require('../controllers/auth.controller');
const profileController = require('../controllers/profile.controller');
const { rateLimit } = require('../middleware/security');
const { registrationLimiters, loginLimiter, mfaLimiter, refreshLimiter, forgotPairLimiter, forgotAccountLimiter, otpRequestLimiter } = require('../middleware/auth-rate-limiters');
const { aiRateLimiter, aiDailyQuota } = require('../middleware/ai-security');
const noStore = (_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');next();};
router.use('/auth', noStore);

// Legacy dashboard/auth paths from the first backend version.
// These are kept to avoid changing any existing frontend API paths.
router.post('/auth/register', ...registrationLimiters, validate(authController.registerSchema), authController.register);
router.post('/auth/register/verify-otp', otpRequestLimiter, authController.verifyRegisterOtp);
router.post('/auth/login', loginLimiter, validate(authController.loginSchema), authController.login);
router.post('/auth/login/verify-otp', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaAuto);
router.post('/auth/mfa/setup/verify', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaSetup);
router.post('/auth/refresh', refreshLimiter, validate(authController.refreshSchema), authController.refresh);
router.post('/auth/forgot-password', forgotPairLimiter, forgotAccountLimiter, validate(authController.forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', otpRequestLimiter, validate(authController.resetPasswordSchema), authController.resetPassword);
router.post('/auth/logout', auth.optionalLenient, validate(authController.logoutSchema), authController.logout);
router.post('/auth/logout-all', auth, authController.logoutAll);

router.get('/profile', auth, controller.me);
router.get('/profile/me', auth, controller.me);
router.patch('/profile', auth, controller.updateProfile);
const legacyEmailOtpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  prefix: 'legacy-email-otp-request',
  keyGenerator: (req) => `${req.ip}:${req.authUser?._id || 'anonymous'}:${String(req.body?.email || '').trim().toLowerCase()}`
});
const legacyEmailOtpConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'legacy-email-otp-confirm',
  keyGenerator: (req) => `${req.ip}:${req.authUser?._id || 'anonymous'}:${String(req.body?.requestId || req.body?.request_id || req.body?.otp_token || '')}`
});
router.post('/profile/email/request-otp', auth, legacyEmailOtpRequestLimiter, validate(profileController.requestEmailOtpSchema), profileController.requestEmailOtp);
router.post('/profile/email/confirm-otp', auth, legacyEmailOtpConfirmLimiter, validate(profileController.confirmEmailOtpSchema), profileController.confirmEmailOtp);

router.get('/medicines/search', auth, controller.searchMedicines);
router.get('/medicines', auth, controller.listMedicines);
router.post('/medicines', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.createMedicine);
router.get('/medicines/:id', auth, controller.getMedicine);
router.put('/medicines/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updateMedicine);
router.patch('/medicines/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updateMedicine);
router.delete('/medicines/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.deleteMedicine);

router.get('/pharmacies', auth, controller.listPharmacies);
router.post('/pharmacies', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.createPharmacy);
router.get('/pharmacies/:id', auth, controller.getPharmacy);
router.put('/pharmacies/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updatePharmacy);
router.patch('/pharmacies/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updatePharmacy);
router.delete('/pharmacies/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.deletePharmacy);

router.get('/inventory', auth, auth.authorize(['admin','pharmacist']), controller.listInventory);
router.post('/inventory/sync', auth, auth.authorize(['admin','pharmacist']), controller.syncInventory);

router.post('/prescriptions/scan', auth, aiRateLimiter, aiDailyQuota, upload.any(), controller.scanPrescription);
router.post('/prescriptions/scan-auth', auth, aiRateLimiter, aiDailyQuota, upload.any(), controller.scanPrescription);

router.get('/notifications', auth, controller.notifications);

router.get('/admins', auth, auth.authorize(['admin']), controller.admins);
router.post('/admins', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.createAdmin);
router.patch('/admins/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updateAdmin);
router.put('/admins/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.updateAdmin);
router.delete('/admins/:id', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.deleteAdmin);

router.get('/approval-requests', auth, auth.authorize(['admin']), controller.approvalRequests);
router.patch('/approval-requests/:id/approve', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.approveRequest);
router.patch('/approval-requests/:id/reject', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.rejectRequest);

router.get('/analytics', auth, auth.authorize(['admin']), auth.requireRecentMfa, controller.legacyAnalytics);

module.exports = router;
