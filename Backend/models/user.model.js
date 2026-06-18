const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'pharmacist', 'patient'], default: 'patient', index: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  phoneNumber: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  // Version 1 represents accounts created before the strengthened password policy.
  // New accounts and every subsequent password change are stored as version 2.
  passwordPolicyVersion: { type: Number, enum: [1, 2], default: 1 },
  tokenVersion: { type: Number, default: 0 },
  // Version 1: administrators created before MFA enforcement (grandfathered).
  // Version 2: newly created/promoted administrators must enroll and verify MFA.
  mfaPolicyVersion: { type: Number, enum: [1, 2], default: 1 },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecretEncrypted: { type: String, default: '', select: false },
  mfaRecoveryCodeHashes: { type: [String], default: [], select: false },
  mfaEnrolledAt: { type: Date, default: null }
}, { timestamps: true, collection: 'users' }));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('User', schema);
