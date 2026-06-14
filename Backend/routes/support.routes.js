const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/support.controller');

router.use(auth, auth.authorize(['admin']));
router.use(auth.requireRecentMfaForWrites);
router.get('/', validate(controller.listSchema), controller.list);
router.post('/', validate(controller.createSchema), controller.create);
router.patch('/:id', validate(controller.updateSchema), controller.update);
router.put('/:id', validate(controller.updateSchema), controller.update);
router.delete('/:id', validate(controller.updateSchema), controller.delete);

module.exports = router;
