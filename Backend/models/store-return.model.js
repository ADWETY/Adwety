const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true },
  qty: { type: Number, required: true, min: 0.0001 },
  price: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const schema = withJsonTransform(new mongoose.Schema({
  kind: { type: String, enum: ['sales', 'purchase'], required: true, index: true },
  number: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreInvoice', default: null },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorePerson', default: null },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorePerson', default: null },
  reason: { type: String, default: '', maxlength: 1000 },
  refund: { type: Number, default: 0, min: 0 },
  items: { type: [itemSchema], default: [] },
  total: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'store_returns' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, number: 1 }, { unique: true });
schema.index({ kind: 1, date: -1, status: 1 });

module.exports = mongoose.model('StoreReturn', schema);
