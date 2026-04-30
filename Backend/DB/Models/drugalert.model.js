const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('DrugAlert', schema);
