const { mongoose, withJsonTransform } = require('./base.model');

const ADMIN_ROLES = ['owner', 'super_admin', 'pharmacy_admin', 'support_admin'];
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

const schema = withJsonTransform(new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phoneNumber: { type: String, trim: true, default: '' },
  role: { type: String, enum: ADMIN_ROLES, default: 'support_admin', index: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  isActive: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'pending', index: true },
  rejectionReason: { type: String, default: '' },
  approvedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}));

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'owner' } });

module.exports = mongoose.model('Admin', schema);
module.exports.ADMIN_ROLES = ADMIN_ROLES;
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
