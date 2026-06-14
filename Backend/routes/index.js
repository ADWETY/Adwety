'use strict';

const router = require('express').Router();
const env = require('../config/env');
const adminRoutes = require('./admin.routes');
const { deprecated, gone } = require('../middleware/api-lifecycle');

router.get('/meta', (_req, res) => res.json({
  api_version: 'v1',
  canonical_base: env.canonicalApiBase,
  mobile_base: `${env.canonicalApiBase}/mobile`
}));

router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/prescriptions', require('./prescriptions.routes'));
router.use('/support-tickets', require('./support.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/pharmacies', require('./pharmacies.routes'));
router.use('/drugs', require('./drugs.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/pharmacy', require('./pharmacy.routes'));
router.use('/search', require('./search.routes'));
router.use('/ai', require('./ai.routes'));

router.use('/admin', adminRoutes);
if (env.enableDashboardAlias) {
  router.use('/dashboard', deprecated({ successor: '/api/v1/admin', sunset: env.apiSunsetAt }), adminRoutes);
} else {
  router.use('/dashboard', gone({ successor: '/api/v1/admin', sunset: env.apiSunsetAt }));
}

module.exports = router;
