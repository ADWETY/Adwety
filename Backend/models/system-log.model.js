const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  type: { type: String, enum: ['system', 'sync', 'login_attempt', 'ai', 'admin_action', 'error'], default: 'system', index: true },
  action: { type: String, required: true, trim: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorRole: { type: String, default: 'anonymous' },
  success: { type: Boolean, default: true },
  message: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  ip: { type: String, default: '' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'system_logs' }));
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ type: 1, createdAt: -1 });
schema.index({ action: 1, createdAt: -1 });
module.exports = mongoose.model('SystemLog', schema);
