const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const controller = require('../controllers/legacy-dashboard.controller');

// Legacy dashboard/auth paths from the first backend version.
// These are kept to avoid changing any existing frontend API paths.
router.post('/auth/register', controller.register);
router.post('/auth/register/verify-otp', controller.otpOk);
router.post('/auth/login', controller.login);
router.post('/auth/login/verify-otp', controller.otpOk);
router.post('/auth/forgot-password', controller.otpOk);
router.post('/auth/reset-password', controller.otpOk);
router.post('/auth/logout', controller.logout);

router.get('/profile', auth, controller.me);
router.get('/profile/me', auth, controller.me);
router.patch('/profile', auth, controller.updateProfile);
router.post('/profile/email/request-otp', auth, controller.otpOk);
router.post('/profile/email/confirm-otp', auth, controller.otpOk);

router.get('/medicines/search', auth, controller.searchMedicines);
router.get('/medicines', auth, controller.listMedicines);
router.post('/medicines', auth, controller.createMedicine);
router.get('/medicines/:id', auth, controller.getMedicine);
router.put('/medicines/:id', auth, controller.updateMedicine);
router.patch('/medicines/:id', auth, controller.updateMedicine);
router.delete('/medicines/:id', auth, controller.deleteMedicine);

router.get('/pharmacies', auth, controller.listPharmacies);
router.post('/pharmacies', auth, controller.createPharmacy);
router.get('/pharmacies/:id', auth, controller.getPharmacy);
router.put('/pharmacies/:id', auth, controller.updatePharmacy);
router.patch('/pharmacies/:id', auth, controller.updatePharmacy);
router.delete('/pharmacies/:id', auth, controller.deletePharmacy);

router.get('/inventory', auth, controller.listInventory);
router.post('/inventory/sync', auth, controller.syncInventory);

router.post('/prescriptions/scan', auth, upload.any(), controller.scanPrescription);
router.post('/prescriptions/scan-auth', auth, upload.any(), controller.scanPrescription);

router.get('/notifications', auth, controller.notifications);

router.get('/admins', auth, controller.admins);
router.post('/admins', auth, controller.createAdmin);
router.patch('/admins/:id', auth, controller.updateAdmin);
router.put('/admins/:id', auth, controller.updateAdmin);
router.delete('/admins/:id', auth, controller.deleteAdmin);

router.get('/approval-requests', auth, controller.approvalRequests);
router.patch('/approval-requests/:id/approve', auth, controller.approveRequest);
router.patch('/approval-requests/:id/reject', auth, controller.rejectRequest);

router.get('/analytics', auth, controller.legacyAnalytics);

module.exports = router;
