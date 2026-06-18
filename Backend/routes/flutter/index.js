const router = require('express').Router();

router.use('/', require('./auth.routes'));
router.use('/', require('./profile.routes'));
router.use('/', require('./pharmacies.routes'));
router.use('/', require('./medicines.routes'));
router.use('/', require('./search.routes'));
router.use('/', require('./notifications.routes'));
router.use('/', require('./analytics.routes'));
router.use('/', require('./prescription.routes'));

module.exports = router;
