const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 'store_categories' }));

applyRetailTenant(schema);

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ pharmacyId: 1, name: 1 }, { unique: true });
schema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('StoreCategory', schema);
