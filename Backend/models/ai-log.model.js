const { mongoose, withJsonTransform } = require('./base.model');
const env = require('../config/env');

const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  // Legacy plaintext fields remain hidden for safe migration of old documents. New writes leave them empty.
  extractedText: { type: String, default: '', select: false },
  extractedDrugs: { type: [String], default: [], select: false },
  redactedPreview: { type: String, default: '', maxlength: 500 },
  drugCount: { type: Number, default: 0, min: 0 },
  sensitivePayloadEncrypted: { type: String, default: '', select: false },
  hasSensitivePayload: { type: Boolean, default: false },
  consentToStore: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started' },
  errorMessage: { type: String, default: '', maxlength: 1000 },
  provider: { type: String, default: 'gemini' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + env.aiLogRetentionDays * 86400000) },
  sensitiveAccessCount: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'ai_logs' }));

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ userId: 1, createdAt: -1 });
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('AiLog', schema);
