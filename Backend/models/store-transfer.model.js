const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true },
  qty: { type: Number, required: true, min: 0.0001 }
}, { _id: false });

const schema = withJsonTransform(new mongoose.Schema({
  number: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now, index: true },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', required: true },
  items: { type: [itemSchema], default: [] },
  notes: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'store_transfers' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, number: 1 }, { unique: true });
schema.index({ date: -1, status: 1 });

module.exports = mongoose.model('StoreTransfer', schema);
