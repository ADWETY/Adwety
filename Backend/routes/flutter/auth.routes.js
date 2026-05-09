const router = require('express').Router();

const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.post('/login', validate(controller.loginSchema), controller.login);
router.post('/register', validate(controller.registerSchema), controller.register);

router.post('/auth/login', validate(controller.loginSchema), controller.login);
router.post('/auth/register', validate(controller.registerSchema), controller.register);

module.exports = router;
