const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/pharmacies.controller');

function validateForRole(adminSchema, pharmacistSchema) {
  return (req, res, next) => {
    const schema = req.authRole === 'admin' ? adminSchema : pharmacistSchema;
    return validate(schema)(req, res, next);
  };
}

router.post(
  '/',
  auth,
  auth.authorize(['admin', 'pharmacist']),
  auth.requireRecentMfa,
  validateForRole(controller.adminCreateSchema, controller.pharmacistCreateSchema),
  controller.create
);
router.get('/', auth.optional, validate(controller.listSchema), controller.list);
router.put(
  '/:id',
  auth,
  auth.authorize(['admin', 'pharmacist']),
  auth.requireRecentMfa,
  validateForRole(controller.adminUpdateSchema, controller.pharmacistUpdateSchema),
  controller.update
);
router.patch(
  '/:id',
  auth,
  auth.authorize(['admin', 'pharmacist']),
  auth.requireRecentMfa,
  validateForRole(controller.adminUpdateSchema, controller.pharmacistUpdateSchema),
  controller.update
);
module.exports = router;
