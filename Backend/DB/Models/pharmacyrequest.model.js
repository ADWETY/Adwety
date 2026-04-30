const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  requestType: { type: String, enum: ['admin_account', 'pharmacy_admin'], default: 'admin_account', index: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  reviewedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  requestedRole: { type: String, enum: ['owner', 'super_admin', 'pharmacy_admin', 'support_admin'], required: true },
  requestedName: { type: String, default: '', trim: true },
  requestedEmail: { type: String, default: '', lowercase: true, trim: true },
  requestedPhone: { type: String, default: '', trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
}));

schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('PharmacyRequest', schema);
