const express = require('express');
const authRoutes = require('./auth/auth.routes');
const medicinesRoutes = require('./medicines/medicines.routes');
const pharmaciesRoutes = require('./pharmacies/pharmacies.routes');
const prescriptionsRoutes = require('./prescriptions/prescriptions.routes');
const profileRoutes = require('./profile/profile.routes');
const notificationsRoutes = require('./notifications/notifications.routes');

module.exports = function registerRoutes(app) {
  const router = express.Router();
  router.use('/auth', authRoutes);
  router.use('/medicines', medicinesRoutes);
  router.use('/pharmacies', pharmaciesRoutes);
  router.use('/prescriptions', prescriptionsRoutes);
  router.use('/profile', profileRoutes);
  router.use('/notifications', notificationsRoutes);
  app.use('/api/v1', router);
};
