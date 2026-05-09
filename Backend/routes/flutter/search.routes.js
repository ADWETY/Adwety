const router = require('express').Router();

const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.get('/search', validate(controller.listSchema), controller.search);
router.get('/search/drugs', validate(controller.listSchema), controller.search);

module.exports = router;
