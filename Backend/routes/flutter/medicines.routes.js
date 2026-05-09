const router = require('express').Router();

const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.get('/medicines', validate(controller.listSchema), controller.medicines);
router.get('/medicines/:id', validate(controller.byIdSchema), controller.medicineDetails);

router.get('/drugs', validate(controller.listSchema), controller.drugSearch);
router.get('/drugs/search', validate(controller.listSchema), controller.drugSearch);

module.exports = router;
