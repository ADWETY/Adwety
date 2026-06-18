const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true },
  name: { type: String, default: '' },
  code: { type: String, default: '' },
  barcode: { type: String, default: '' },
  unit: { type: String, default: 'Piece' },
  unitFactor: { type: Number, default: 1, min: 0.0001 },
  qty: { type: Number, required: true, min: 0.0001 },
  price: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const schema = withJsonTransform(new mongoose.Schema({
  kind: { type: String, enum: ['sale', 'purchase'], required: true, index: true },
  number: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now, index: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorePerson', default: null, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorePerson', default: null, index: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank', 'wallet', 'credit', 'mixed'], default: 'cash' },
  discount: { type: Number, default: 0, min: 0 },
  paid: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', maxlength: 2000 },
  items: { type: [itemSchema], default: [] },
  subtotal: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  due: { type: Number, default: 0, min: 0 },
  profit: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'cancelled', 'void'], default: 'active', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: '' }
}, { timestamps: true, collection: 'store_invoices' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, number: 1 }, { unique: true });
schema.index({ pharmacyId: 1, kind: 1, date: -1, status: 1 });
schema.index({ kind: 1, date: -1, status: 1 });
schema.index({ number: 'text', notes: 'text' });

module.exports = mongoose.model('StoreInvoice', schema);
