const router = require('express').Router();
const auth = require('../../middleware/auth');
const auditAction = require('../../middleware/audit');
const validate = require('../../middleware/validation');
const controller = require('./pharmacies.controller');
const { listSchema, byIdSchema, createSchema, updateSchema } = require('./pharmacies.validation');
const { authorize } = auth;

router.use(auth);
router.get('/', authorize(['super_admin', 'pharmacy_admin', 'support_admin']), validate(listSchema), controller.list);
router.post('/', authorize(['super_admin']), validate(createSchema), auditAction('pharmacy.create'), controller.create);
router.get('/:id', authorize(['super_admin', 'pharmacy_admin', 'support_admin']), validate(byIdSchema), controller.getById);
router.put('/:id', authorize(['super_admin']), validate(updateSchema), auditAction('pharmacy.update'), controller.update);
router.delete('/:id', authorize(['super_admin']), validate(byIdSchema), auditAction('pharmacy.delete'), controller.remove);

module.exports = router;
