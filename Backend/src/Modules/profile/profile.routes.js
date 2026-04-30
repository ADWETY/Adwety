const router = require('express').Router();
const auth = require('../../middleware/auth');
const controller = require('./profile.controller');

router.use(auth);
router.get('/', controller.getProfile);
router.get('/me', controller.getProfile);

module.exports = router;
