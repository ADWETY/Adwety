const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true, immutable: true },
  purpose: { type: String, enum: ['password_reset', 'change_email'], required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountEmail: { type: String, required: true, lowercase: true, trim: true },
  targetEmail: { type: String, lowercase: true, trim: true, default: '' },
  otpHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 5, min: 1, max: 10 },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null, index: true },
  requestedIp: { type: String, default: '' },
  requestedUserAgent: { type: String, default: '', maxlength: 500 }
}, { timestamps: true, collection: 'otp_requests' }));

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ userId: 1, purpose: 1, consumedAt: 1, expiresAt: 1 });

module.exports = mongoose.model('OtpRequest', schema);
