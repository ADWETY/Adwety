const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { aiRateLimiter, aiDailyQuota } = require('../middleware/ai-security');
const controller = require('../controllers/legacy-dashboard.controller');

router.post('/scan', auth, aiRateLimiter, aiDailyQuota, upload.any(), controller.scanPrescription);
module.exports = router;
