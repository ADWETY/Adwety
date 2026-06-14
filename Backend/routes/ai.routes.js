const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const upload = require('../middleware/upload');
const { aiRateLimiter, aiDailyQuota } = require('../middleware/ai-security');
const controller = require('../controllers/ai.controller');

router.post('/prescription', auth, aiRateLimiter, aiDailyQuota, upload.any(), validate(controller.schema), controller.analyze);
module.exports = router;
