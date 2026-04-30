const bcrypt = require('bcryptjs');
const Admin = require('../../../DB/Models/admin.model');
const Pharmacy = require('../../../DB/Models/pharmacy.model');
const env = require('../../config/env');
const { AppError } = require('../../utils/error-handling');
const { validateObjectId } = require('../../utils/helpers');
const { sanitizeEmail } = require('../../utils/security');

function serializeAdmin(admin) {
  return {
    id: admin._id.toString(),
    name: admin.fullName,
    email: admin.email,
    phone_number: admin.phoneNumber || '',
    role: admin.role,
    status: admin.isActive ? 'active' : 'inactive',
    approval_status: admin.approvalStatus,
    email_verified: Boolean(admin.isEmailVerified),
    assigned_pharmacy: admin.pharmacyId || null,
    last_login: admin.lastLoginAt,
    created_at: admin.createdAt,
  };
}

async function assertCanWrite(admin, currentOwnerId) {
  if (!admin) throw new AppError('Admin not found', 404);
  if (admin.role === 'owner' && String(admin._id) !== String(currentOwnerId)) {
    throw new AppError('Owner account cannot be modified here', 403);
  }
}

async function resolvePharmacyId(pharmacyId, role) {
  if (role !== 'pharmacy_admin') return null;
  if (!pharmacyId) throw new AppError('pharmacy_id is required for pharmacy_admin accounts', 422);
  validateObjectId(pharmacyId, 'pharmacy_id');
  const pharmacy = await Pharmacy.findById(pharmacyId).select('_id');
  if (!pharmacy) throw new AppError('Assigned pharmacy was not found', 404);
  return pharmacy._id;
}

async function listAdmins(query = {}) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.approval_status) filter.approvalStatus = query.approval_status;
  const rows = await Admin.find(filter).sort({ role: 1, createdAt: -1 }).limit(200);
  return rows.map(serializeAdmin);
}

async function createAdmin(payload) {
  const role = payload.role;
  if (!['super_admin', 'pharmacy_admin', 'support_admin'].includes(role)) {
    throw new AppError('Owner can only create super_admin, pharmacy_admin or support_admin from this endpoint', 400);
  }
  const email = sanitizeEmail(payload.email);
  const exists = await Admin.findOne({ email });
  if (exists) throw new AppError('Email already exists', 409);

  const passwordHash = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
  const admin = await Admin.create({
    fullName: payload.full_name,
    email,
    passwordHash,
    phoneNumber: payload.phone_number || '',
    role,
    pharmacyId: await resolvePharmacyId(payload.pharmacy_id, role),
    isActive: true,
    isEmailVerified: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  });
  return serializeAdmin(admin);
}

async function updateAdmin(id, payload, currentOwnerId) {
  const admin = await Admin.findById(id);
  await assertCanWrite(admin, currentOwnerId);
  if (payload.full_name !== undefined) admin.fullName = payload.full_name;
  if (payload.phone_number !== undefined) admin.phoneNumber = payload.phone_number;
  if (payload.role !== undefined) {
    if (!['super_admin', 'pharmacy_admin', 'support_admin'].includes(payload.role)) throw new AppError('Invalid admin role', 400);
    admin.role = payload.role;
  }
  if (payload.pharmacy_id !== undefined || payload.role !== undefined) {
    const nextRole = payload.role || admin.role;
    admin.pharmacyId = await resolvePharmacyId(payload.pharmacy_id || admin.pharmacyId, nextRole);
  }
  if (payload.is_active !== undefined) admin.isActive = Boolean(payload.is_active);
  await admin.save();
  return serializeAdmin(admin);
}

async function deleteAdmin(id, currentOwnerId) {
  const admin = await Admin.findById(id);
  await assertCanWrite(admin, currentOwnerId);
  if (String(admin._id) === String(currentOwnerId)) throw new AppError('Owner cannot delete own account', 400);
  await Admin.deleteOne({ _id: admin._id });
  return { deleted: true };
}

module.exports = { listAdmins, createAdmin, updateAdmin, deleteAdmin };
