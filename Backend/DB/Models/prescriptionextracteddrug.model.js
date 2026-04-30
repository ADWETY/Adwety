const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug', default: null },
  extractedName: { type: String, required: true, trim: true },
  confidenceScore: { type: Number, min: 0, max: 1, default: 0.5 },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('PrescriptionExtractedDrug', schema);
