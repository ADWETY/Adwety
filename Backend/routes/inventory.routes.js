const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/inventory.controller');
router.post('/sync', auth, auth.authorize(['admin','pharmacist']), auth.requireRecentMfa, validate(controller.syncSchema), controller.sync);
module.exports = router;
