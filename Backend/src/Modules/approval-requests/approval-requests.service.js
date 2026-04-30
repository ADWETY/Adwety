const Admin = require('../../../DB/Models/admin.model');
const Pharmacy = require('../../../DB/Models/pharmacy.model');
const ApprovalRequest = require('../../../DB/Models/pharmacyrequest.model');
const { AppError } = require('../../utils/error-handling');

function serializeRequest(request) {
  const admin = request.adminId && typeof request.adminId === 'object' ? request.adminId : null;
  const pharmacy = request.pharmacyId && typeof request.pharmacyId === 'object' ? request.pharmacyId : null;
  return {
    id: request._id.toString(),
    request_type: request.requestType,
    status: request.status,
    requested_role: request.requestedRole,
    requested_name: request.requestedName || admin?.fullName || '',
    requested_email: request.requestedEmail || admin?.email || '',
    requested_phone: request.requestedPhone || admin?.phoneNumber || '',
    pharmacy_name: pharmacy?.name || request.metadata?.pharmacy_name || '',
    pharmacy_address: pharmacy?.address || request.metadata?.pharmacy_address || '',
    pharmacy_phone: pharmacy?.phone || request.metadata?.pharmacy_phone || '',
    pharmacy_email: pharmacy?.email || request.metadata?.pharmacy_email || '',
    rejection_reason: request.rejectionReason || '',
    submitted_at: request.submittedAt,
    reviewed_at: request.reviewedAt,
    reviewed_by_admin_id: request.reviewedByAdminId,
  };
}

async function listRequests(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.requestType = query.type;
  if (query.role) filter.requestedRole = query.role;

  const rows = await ApprovalRequest.find(filter)
    .populate('adminId')
    .populate('pharmacyId')
    .sort({ submittedAt: -1 })
    .limit(200);

  return rows.map(serializeRequest);
}

async function approveRequest(id, ownerId) {
  const request = await ApprovalRequest.findById(id);
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'pending') throw new AppError('Only pending requests can be approved', 400);

  const admin = await Admin.findById(request.adminId);
  if (!admin) throw new AppError('Linked admin account not found', 404);
  if (admin.role === 'owner') throw new AppError('Owner account cannot be approved through requests', 400);

  admin.isActive = true;
  admin.isEmailVerified = true;
  admin.approvalStatus = 'approved';
  admin.rejectionReason = '';
  admin.approvedByAdminId = ownerId;
  admin.approvedAt = new Date();
  await admin.save();

  if (request.pharmacyId) {
    await Pharmacy.findByIdAndUpdate(request.pharmacyId, { status: 'active' });
  }

  request.status = 'approved';
  request.reviewedByAdminId = ownerId;
  request.reviewedAt = new Date();
  request.rejectionReason = '';
  await request.save();

  const populated = await ApprovalRequest.findById(request._id).populate('adminId').populate('pharmacyId');
  return serializeRequest(populated);
}

async function rejectRequest(id, ownerId, rejectionReason = '') {
  const request = await ApprovalRequest.findById(id);
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'pending') throw new AppError('Only pending requests can be rejected', 400);

  const admin = await Admin.findById(request.adminId);
  if (admin) {
    admin.isActive = false;
    admin.approvalStatus = 'rejected';
    admin.rejectionReason = rejectionReason || 'Rejected by Owner';
    await admin.save();
  }

  if (request.pharmacyId) {
    await Pharmacy.findByIdAndUpdate(request.pharmacyId, { status: 'rejected' });
  }

  request.status = 'rejected';
  request.reviewedByAdminId = ownerId;
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason || 'Rejected by Owner';
  await request.save();

  const populated = await ApprovalRequest.findById(request._id).populate('adminId').populate('pharmacyId');
  return serializeRequest(populated);
}

module.exports = { listRequests, approveRequest, rejectRequest };
