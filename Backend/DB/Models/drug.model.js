const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true, index: true },
  strength: { type: String, required: true, trim: true },
  form: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Drug', schema);
