const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  type: { type: String, enum: ['stock', 'system'], default: 'system', index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  audience: { type: String, enum: ['all', 'admin', 'pharmacist', 'patient'], default: 'all', index: true },
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  recipientPharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  metadata: { type: Object, default: {} },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, collection: 'notifications' }));

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ createdAt: -1 });
schema.index({ recipientPharmacyId: 1, createdAt: -1 });
schema.index({ recipientUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', schema);
