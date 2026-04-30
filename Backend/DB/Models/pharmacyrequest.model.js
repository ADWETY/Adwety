const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  reviewedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('PharmacyRequest', schema);
