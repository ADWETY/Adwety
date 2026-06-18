const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const schema = withJsonTransform(new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 160 },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '', maxlength: 1000 },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreWarehouse', default: null, index: true },
  sourceType: { type: String, enum: ['manual', 'sale', 'purchase', 'sales_return', 'purchase_return', 'invoice_cancel', 'opening'], default: 'manual', index: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, collection: 'store_treasury_movements' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, type: 1, date: -1 });
schema.index({ type: 1, date: -1 });
schema.index({ category: 'text', description: 'text' });

module.exports = mongoose.model('StoreTreasuryMovement', schema);
