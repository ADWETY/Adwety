const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const controller = require('../controllers/admin.controller');
const authController = require('../controllers/auth.controller');
const { loginLimiter, mfaLimiter, refreshLimiter } = require('../middleware/auth-rate-limiters');
const noStore = (_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');next();};
router.use('/auth', noStore);

// Dashboard/Admin authentication. The dashboard uses normal JWT tokens.
router.post('/auth/login', loginLimiter, validate(controller.loginSchema), controller.dashboardLogin);
router.post('/auth/mfa/verify', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaAuto);
router.post('/auth/mfa/setup/verify', mfaLimiter, validate(authController.mfaVerifySchema), authController.verifyMfaSetup);
router.post('/auth/refresh', refreshLimiter, validate(authController.refreshSchema), authController.refresh);
router.post('/auth/logout', auth.optionalLenient, validate(authController.logoutSchema), authController.logout);
router.post('/auth/logout-all', auth, auth.authorize(['admin']), authController.logoutAll);
router.post('/auth/mfa/reauth', auth, auth.authorize(['admin']), mfaLimiter, validate(authController.mfaReauthSchema), authController.reauthMfa);
router.get('/auth/me', auth, auth.authorize(['admin']), controller.dashboardMe);
router.get('/me', auth, auth.authorize(['admin']), controller.dashboardMe);

router.use(auth, auth.authorize(['admin']));
router.use(auth.requireRecentMfaForWrites);


// Retail/MATGR business modules were removed from the administrator dashboard.
// Keep a guarded response for old clients instead of mounting retail routes for admins.
router.use('/retail', (_req, res) => res.status(403).json({
  error: 'Admin retail modules are disabled',
  code: 'ADMIN_RETAIL_DISABLED'
}));

// Dashboard overview and settings.
router.get('/analytics', validate(controller.analyticsSchema), controller.analytics);
router.get('/settings', controller.settings);

// Users CRUD.
router.get('/users', validate(controller.userListSchema), controller.users);
router.post('/users', validate(controller.createUserSchema), controller.createUser);
router.get('/users/:id', validate(controller.byIdSchema), controller.getUser);
router.patch('/users/:id', validate(controller.updateUserSchema), controller.updateUser);
router.put('/users/:id', validate(controller.updateUserSchema), controller.updateUser);
router.delete('/users/:id', validate(controller.byIdSchema), controller.deleteUser);

// Pharmacies CRUD.
router.get('/pharmacy-requests', validate(controller.pharmacyRequestListSchema), controller.pharmacyRequests);
router.patch('/pharmacy-requests/:id/approve', validate(controller.byIdSchema), controller.approvePharmacyRequest);
router.patch('/pharmacy-requests/:id/reject', validate(controller.byIdSchema), controller.rejectPharmacyRequest);
router.get('/pharmacies', validate(controller.pharmacyListSchema), controller.pharmacies);
router.post('/pharmacies', validate(controller.createPharmacySchema), controller.createPharmacy);
router.get('/pharmacies/:id', validate(controller.byIdSchema), controller.getPharmacy);
router.patch('/pharmacies/:id', validate(controller.updatePharmacySchema), controller.updatePharmacy);
router.put('/pharmacies/:id', validate(controller.updatePharmacySchema), controller.updatePharmacy);
router.delete('/pharmacies/:id', validate(controller.byIdSchema), controller.deletePharmacy);

// Drugs CRUD.
router.get('/drugs', validate(controller.drugListSchema), controller.drugs);
router.post('/drugs', validate(controller.createDrugSchema), controller.createDrug);
router.get('/drugs/:id', validate(controller.byIdSchema), controller.getDrug);
router.patch('/drugs/:id', validate(controller.updateDrugSchema), controller.updateDrug);
router.put('/drugs/:id', validate(controller.updateDrugSchema), controller.updateDrug);
router.delete('/drugs/:id', validate(controller.byIdSchema), controller.deleteDrug);

// Categories CRUD.
router.get('/categories', validate(controller.listSchema), controller.categories);
router.post('/categories', validate(controller.createCategorySchema), controller.createCategory);
router.get('/categories/:id', validate(controller.byIdSchema), controller.getCategory);
router.patch('/categories/:id', validate(controller.updateCategorySchema), controller.updateCategory);
router.put('/categories/:id', validate(controller.updateCategorySchema), controller.updateCategory);
router.delete('/categories/:id', validate(controller.byIdSchema), controller.deleteCategory);

// Inventory CRUD and dashboard sync.
router.get('/inventory', validate(controller.inventoryListSchema), controller.inventory);
router.post('/inventory', validate(controller.createInventorySchema), controller.createInventoryItem);
router.post('/inventory/sync', validate(controller.syncInventorySchema), controller.syncInventory);
router.get('/inventory/:id', validate(controller.byIdSchema), controller.getInventoryItem);
router.patch('/inventory/:id', validate(controller.updateInventorySchema), controller.updateInventoryItem);
router.put('/inventory/:id', validate(controller.updateInventorySchema), controller.updateInventoryItem);
router.delete('/inventory/:id', validate(controller.byIdSchema), controller.deleteInventoryItem);

// Logs.
router.get('/logs', validate(controller.logListSchema), controller.logs);
router.get('/logs/:id', validate(controller.logByIdSchema), controller.getLog);
router.delete('/logs/:id', validate(controller.logByIdSchema), controller.deleteLog);
router.get('/ai-logs', auth.requireRecentMfa, validate(controller.logListSchema), controller.aiLogs);
router.get('/ai-logs/:id/sensitive', auth.requireRecentMfa, validate(controller.aiSensitiveLogSchema), controller.getSensitiveAiLog);
router.get('/system-logs', validate(controller.logListSchema), controller.systemLogs);

module.exports = router;
