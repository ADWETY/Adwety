const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phoneNumber: { type: String, trim: true, default: '' },
  accountType: { type: String, enum: ['user', 'admin'], required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, default: 'user' },
  purpose: { type: String, enum: ['register', 'login', 'password_reset'], required: true, index: true },
  otpHash: { type: String, required: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  consumedAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  metadata: { type: Object, default: {} },
}, { timestamps: true }));

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.virtual('id').get(function () { return this._id.toString(); });

module.exports = mongoose.model('OtpChallenge', schema);
