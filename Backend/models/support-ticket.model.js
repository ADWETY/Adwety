const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 220 },
  message: { type: String, trim: true, default: '', maxlength: 5000 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  userName: { type: String, trim: true, default: '' },
  userEmail: { type: String, trim: true, lowercase: true, default: '' },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null, index: true },
  pharmacyName: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
  assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAdminName: { type: String, trim: true, default: '' },
  resolution: { type: String, trim: true, default: '', maxlength: 2000 }
}, { timestamps: true, collection: 'support_tickets' }));

schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('SupportTicket', schema);
