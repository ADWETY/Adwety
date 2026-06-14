const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/pharmacy.controller');

router.get('/my-inventory', auth, auth.authorize(['pharmacist']), validate(controller.myInventorySchema), controller.myInventory);

module.exports = router;
