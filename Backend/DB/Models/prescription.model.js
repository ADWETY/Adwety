const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, default: null },
  extractedText: { type: String, default: '' },
  status: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded' },
  uploadedAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Prescription', schema);
