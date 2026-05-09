const router = require('express').Router();
const adminRoutes = require('./admin.routes');

router.use('/auth', require('./auth.routes'));
router.use('/pharmacies', require('./pharmacies.routes'));
router.use('/drugs', require('./drugs.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/search', require('./search.routes'));
router.use('/ai', require('./ai.routes'));

// Admin Dashboard aliases. Both paths point to the same complete dashboard backend.
router.use('/admin', adminRoutes);
router.use('/dashboard', adminRoutes);

module.exports = router;
