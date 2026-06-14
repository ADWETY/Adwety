const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/notifications.controller');

router.use(auth, auth.authorize(['admin', 'pharmacist']));
router.get('/', validate(controller.listSchema), controller.list);
router.post('/notify-pharmacy', validate(controller.notifyPharmacySchema), controller.notifyPharmacy);
router.patch('/read-all', validate(controller.listSchema), controller.markAllRead);
router.patch('/:id/read', validate(controller.byIdSchema), controller.markRead);
router.delete('/:id', validate(controller.byIdSchema), controller.remove);

module.exports = router;
