const router = require('express').Router();
const auth = require('../../middleware/auth');
const auditAction = require('../../middleware/audit');
const controller = require('./admins.controller');
const { authorize } = auth;

router.use(auth, authorize(['owner']));
router.get('/', controller.list);
router.post('/', auditAction('admin.create'), controller.create);
router.patch('/:id', auditAction('admin.update'), controller.update);
router.delete('/:id', auditAction('admin.delete'), controller.remove);

module.exports = router;
