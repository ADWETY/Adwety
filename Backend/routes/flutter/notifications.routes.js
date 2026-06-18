const router = require('express').Router();

const auth = require('../../middleware/auth');
const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.get(
  '/notifications',
  auth,
  validate(controller.notificationsSchema),
  controller.notifications
);

router.patch(
  '/notifications/:id/read',
  auth,
  validate(controller.notificationByIdSchema),
  controller.markNotificationRead
);

module.exports = router;
