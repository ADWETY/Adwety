const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  workingHours: { type: String, default: '', trim: true },
  googleMapsUrl: { type: String, default: '', trim: true },
  latitude: { type: Number, required: true, default: 30.0444 },
  longitude: { type: Number, required: true, default: 31.2357 },
  rating: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'inactive'], default: 'active' },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}));

schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('Pharmacy', schema);
