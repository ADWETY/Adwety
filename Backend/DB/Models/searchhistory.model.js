const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  queryText: { type: String, required: true, trim: true },
  searchedAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('SearchHistory', schema);
