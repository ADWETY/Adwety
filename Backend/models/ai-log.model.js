const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  extractedText: { type: String, default: '' },
  extractedDrugs: [{ type: String, trim: true }],
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started' },
  errorMessage: { type: String, default: '' },
  provider: { type: String, default: 'gemini' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'ai_logs' }));
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model('AiLog', schema);
