const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestIdHash: { type: String, required: true, unique: true, select: false },
  purpose: { type: String, enum: ['login', 'setup'], required: true },
  setupSecretEncrypted: { type: String, default: '', select: false },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, required: true },
  consumedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  ip: { type: String, default: '', maxlength: 100 },
  userAgent: { type: String, default: '', maxlength: 500 }
}, { timestamps: true, collection: 'mfa_challenges' }));

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('MfaChallenge', schema);
