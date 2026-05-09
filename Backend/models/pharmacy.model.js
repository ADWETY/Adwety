const { mongoose, withJsonTransform } = require('./base.model');
const pointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true, default: [31.2357, 30.0444] }
}, { _id: false });
const schema = withJsonTransform(new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  status: { type: String, enum: ['pending', 'approved', 'active', 'inactive', 'rejected'], default: 'active', index: true },
  latitude: { type: Number, min: -90, max: 90, required: true },
  longitude: { type: Number, min: -180, max: 180, required: true },
  location: { type: pointSchema, required: true, default: () => ({ type: 'Point', coordinates: [31.2357, 30.0444] }) },
  workingHours: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rating: { type: Number, min: 0, max: 5, default: 0 }
}, { timestamps: true, collection: 'pharmacies' }));
schema.pre('validate', function syncLocation(next) {
  if (this.latitude !== undefined && this.longitude !== undefined) {
    this.location = { type: 'Point', coordinates: [Number(this.longitude), Number(this.latitude)] };
  } else if (this.location?.coordinates?.length === 2) {
    this.longitude = Number(this.location.coordinates[0]);
    this.latitude = Number(this.location.coordinates[1]);
  }
  next();
});
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ location: '2dsphere' });
schema.index({ status: 1, name: 1 });
schema.index({ ownerId: 1 });
module.exports = mongoose.model('Pharmacy', schema);
