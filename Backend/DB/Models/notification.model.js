const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'general' },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Notification', schema);
