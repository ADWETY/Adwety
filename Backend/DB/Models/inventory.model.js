const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug', required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, drugId: 1 }, { unique: true });
module.exports = mongoose.model('Inventory', schema);
