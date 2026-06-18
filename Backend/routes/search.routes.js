const router = require('express').Router();
const validate = require('../middleware/validation');
const controller = require('../controllers/search.controller');
router.get('/', validate(controller.searchSchema), controller.search);
module.exports = router;
