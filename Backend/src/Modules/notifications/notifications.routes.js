const router = require('express').Router();
const auth = require('../../middleware/auth');
const controller = require('./notifications.controller');

router.use(auth);
router.get('/', controller.list);

module.exports = router;
