const router = require('express').Router();
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/profile.controller');
const { rateLimit } = require('../middleware/security');

router.use(auth, auth.authorize(['admin', 'pharmacist']));

router.get('/', controller.me);
router.patch('/', validate(z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    full_name: z.string().min(2).max(100).optional(),
    name: z.string().min(2).max(100).optional(),
    phoneNumber: z.string().max(32).optional(),
    phone_number: z.string().max(32).optional()
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
})), controller.updateProfile);


router.post('/password', validate(z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128).optional(),
    current_password: z.string().min(1).max(128).optional(),
    newPassword: z.string().min(12).max(128).optional(),
    new_password: z.string().min(12).max(128).optional()
  }).strict().refine((v) => v.currentPassword || v.current_password, 'current password is required').refine((v) => v.newPassword || v.new_password, 'new password is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
})), controller.changePassword);

const emailOtpRequestLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 4,
  prefix: 'profile-email-otp-request',
  keyGenerator: (req) => `${req.ip}:${req.authUser?._id || 'anonymous'}:${String(req.body?.email || '').trim().toLowerCase()}`
});
const emailOtpConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'profile-email-otp-confirm',
  keyGenerator: (req) => `${req.ip}:${req.authUser?._id || 'anonymous'}:${String(req.body?.requestId || req.body?.request_id || req.body?.otp_token || '')}`
});

router.post('/email/request-otp', emailOtpRequestLimiter, validate(controller.requestEmailOtpSchema), controller.requestEmailOtp);
router.post('/email/confirm-otp', emailOtpConfirmLimiter, validate(controller.confirmEmailOtpSchema), controller.confirmEmailOtp);

module.exports = router;
