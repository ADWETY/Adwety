const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  factor: { type: Number, default: 1, min: 0.0001 },
  salePrice: { type: Number, default: 0, min: 0 }
}, { _id: false });

const schema = withJsonTransform(new mongoose.Schema({
  code: { type: String, required: true, trim: true, maxlength: 80 },
  barcode: { type: String, default: '', trim: true, index: true, maxlength: 120 },
  name: { type: String, required: true, trim: true, maxlength: 220 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategory', default: null, index: true },
  unit: { type: String, default: 'Piece', trim: true, maxlength: 80 },
  unitFactor: { type: Number, default: 1, min: 0.0001 },
  purchasePrice: { type: Number, default: 0, min: 0 },
  salePrice: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  stock: { type: Map, of: Number, default: {} },
  units: { type: [unitSchema], default: [] },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'StorePerson', default: null },
  notes: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  searchText: { type: String, default: '' }
}, { timestamps: true, collection: 'store_products' }));

schema.pre('save', function buildSearchText(next) {
  this.searchText = [this.code, this.barcode, this.name, this.unit, ...(this.units || []).map((u) => u.name)]
    .filter(Boolean).join(' ').toLowerCase();
  if (!this.units || !this.units.length) {
    this.units = [{ name: this.unit || 'Piece', factor: this.unitFactor || 1, salePrice: this.salePrice || 0 }];
  }
  next();
});

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, code: 1 }, { unique: true });
schema.index({ pharmacyId: 1, barcode: 1 });
schema.index({ name: 'text', code: 'text', barcode: 'text', searchText: 'text' });
schema.index({ status: 1, categoryId: 1 });

module.exports = mongoose.model('StoreProduct', schema);
