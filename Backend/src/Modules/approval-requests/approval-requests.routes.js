const router = require('express').Router();
const auth = require('../../middleware/auth');
const auditAction = require('../../middleware/audit');
const controller = require('./approval-requests.controller');
const { authorize } = auth;

router.use(auth, authorize(['owner']));
router.get('/', controller.list);
router.patch('/:id/approve', auditAction('approval_request.approve'), controller.approve);
router.patch('/:id/reject', auditAction('approval_request.reject'), controller.reject);

module.exports = router;
