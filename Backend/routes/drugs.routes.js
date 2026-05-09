const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/drugs.controller');
router.get('/', validate(controller.listSchema), controller.list);
router.get('/search', validate(controller.searchSchema), controller.search);
router.post('/', auth, auth.authorize(['admin','pharmacist']), validate(controller.createSchema), controller.create);
router.put('/:id', auth, auth.authorize(['admin','pharmacist']), validate(controller.updateSchema), controller.update);
module.exports = router;
