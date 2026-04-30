const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Category', schema);
