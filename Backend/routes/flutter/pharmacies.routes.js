const router = require('express').Router();

const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.get('/pharmacies', validate(controller.listSchema), controller.pharmacies);
router.get('/pharmacies/:id', validate(controller.byIdSchema), controller.pharmacyDetails);

module.exports = router;
