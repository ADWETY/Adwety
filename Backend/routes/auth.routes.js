const router = require('express').Router();
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');
const controller = require('../controllers/auth.controller');
router.post('/register', validate(controller.registerSchema), controller.register);
router.post('/login', validate(controller.loginSchema), controller.login);
router.get('/me', auth, controller.me);
module.exports = router;
