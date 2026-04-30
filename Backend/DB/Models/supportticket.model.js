const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('SupportTicket', schema);
