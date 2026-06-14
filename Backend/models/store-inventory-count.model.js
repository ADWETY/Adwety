const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreProduct', required: true },
  currentQty: { type: Number, default: 0 },
  countedQty: { type: Number, required: true, min: 0 },
  difference: { type: Number, default: 0 },
  note: { type: String, default: '' }
}, { _id: false });

const schema = withJsonTransform(new mongoose.Schema({
  number: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now, index: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', required: true },
  items: { type: [itemSchema], default: [] },
  notes: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['draft', 'applied', 'cancelled'], default: 'applied' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'store_inventory_counts' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, number: 1 }, { unique: true });
schema.index({ warehouseId: 1, date: -1, status: 1 });

module.exports = mongoose.model('StoreInventoryCount', schema);
