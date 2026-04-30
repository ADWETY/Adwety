const router = require('express').Router();
const auth = require('../../middleware/auth');
const auditAction = require('../../middleware/audit');
const validate = require('../../middleware/validation');
const controller = require('./medicines.controller');
const { listSchema, byIdSchema, createSchema, updateSchema } = require('./medicines.validation');
const { authorize } = auth;

router.use(auth);
router.get('/', validate(listSchema), controller.list);
router.post('/', authorize(['super_admin', 'pharmacy_admin']), validate(createSchema), auditAction('medicine.create'), controller.create);
router.get('/:id', validate(byIdSchema), controller.getById);
router.put('/:id', authorize(['super_admin', 'pharmacy_admin']), validate(updateSchema), auditAction('medicine.update'), controller.update);
router.delete('/:id', authorize(['super_admin']), validate(byIdSchema), auditAction('medicine.delete'), controller.remove);

module.exports = router;
