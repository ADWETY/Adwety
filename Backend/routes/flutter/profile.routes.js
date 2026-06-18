const router = require('express').Router();

const auth = require('../../middleware/auth');
const validate = require('../../middleware/validation');
const controller = require('../../controllers/flutter');

router.get('/profile', auth, controller.profile);
router.get('/profile/me', auth, controller.profile);
router.get('/auth/me', auth, controller.profile);

router.patch(
  '/profile',
  auth,
  validate(controller.updateProfileSchema),
  controller.updateProfile
);

module.exports = router;
