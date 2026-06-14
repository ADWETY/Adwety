const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true, select: false },
  csrfTokenHash: { type: String, default: null, select: false },
  familyId: { type: String, required: true, index: true },
  tokenVersion: { type: Number, required: true, default: 0 },
  mfaVerifiedAt: { type: Date, default: null },
  userAgent: { type: String, default: '', maxlength: 500 },
  ip: { type: String, default: '', maxlength: 100 },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null, index: true },
  revokeReason: { type: String, default: '', maxlength: 200 },
  replacedBySessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null }
}, { timestamps: true, collection: 'sessions' }));

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Session', schema);
