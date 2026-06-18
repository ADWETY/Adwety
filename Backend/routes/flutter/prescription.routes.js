const router = require('express').Router();

const auth = require('../../middleware/auth');
const validate = require('../../middleware/validation');
const upload = require('../../middleware/upload');
const controller = require('../../controllers/flutter');
const { aiRateLimiter, aiDailyQuota } = require('../../middleware/ai-security');

router.post(
  '/scan/prescription',
  auth,
  aiRateLimiter,
  aiDailyQuota,
  upload.any(),
  validate(controller.scanSchema),
  controller.scanPrescription
);

router.post(
  '/ai/prescription',
  auth,
  aiRateLimiter,
  aiDailyQuota,
  upload.any(),
  validate(controller.scanSchema),
  controller.scanPrescription
);

module.exports = router;
