const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 'store_categories' }));

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('StoreCategory', schema);
