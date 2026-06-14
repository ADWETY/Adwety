const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
  address: { type: String, default: '', maxlength: 500 },
  manager: { type: String, default: '', maxlength: 120 },
  phone: { type: String, default: '', maxlength: 40 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 'store_warehouses' }));

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ name: 'text', code: 'text', address: 'text', manager: 'text' });

module.exports = mongoose.model('StoreWarehouse', schema);
