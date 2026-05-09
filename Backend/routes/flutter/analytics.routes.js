const router = require('express').Router();

const auth = require('../../middleware/auth');
const controller = require('../../controllers/flutter');

router.get('/analytics', auth, controller.analytics);

module.exports = router;
