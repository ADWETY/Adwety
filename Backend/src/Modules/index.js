const express = require('express');
const authRoutes = require('./auth/auth.routes');
const medicinesRoutes = require('./medicines/medicines.routes');
const pharmaciesRoutes = require('./pharmacies/pharmacies.routes');
const prescriptionsRoutes = require('./prescriptions/prescriptions.routes');
const profileRoutes = require('./profile/profile.routes');
const notificationsRoutes = require('./notifications/notifications.routes');
const approvalRequestsRoutes = require('./approval-requests/approval-requests.routes');
const adminsRoutes = require('./admins/admins.routes');

module.exports = function registerRoutes(app) {
  const router = express.Router();
  router.use('/auth', authRoutes);
  router.use('/medicines', medicinesRoutes);
  router.use('/pharmacies', pharmaciesRoutes);
  router.use('/prescriptions', prescriptionsRoutes);
  router.use('/profile', profileRoutes);
  router.use('/notifications', notificationsRoutes);
  router.use('/approval-requests', approvalRequestsRoutes);
  router.use('/pharmacy-requests', approvalRequestsRoutes);
  router.use('/admins', adminsRoutes);
  app.use('/api/v1', router);
};
