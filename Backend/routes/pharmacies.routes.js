const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/pharmacies.controller');
router.post('/', auth, auth.authorize(['admin','pharmacist']), validate(controller.createSchema), controller.create);
router.get('/', auth.optional, validate(controller.listSchema), controller.list);
router.put('/:id', auth, auth.authorize(['admin','pharmacist']), validate(controller.updateSchema), controller.update);
module.exports = router;
