const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug', required: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'pos_snapshot' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'inventory_snapshots' }));
schema.pre('save', function setUpdatedAt(next) { this.updatedAt = new Date(); next(); });
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, drugId: 1 }, { unique: true });
schema.index({ drugId: 1, quantity: -1, updatedAt: -1 });
schema.index({ pharmacyId: 1, updatedAt: -1 });
module.exports = mongoose.model('InventorySnapshot', schema);
