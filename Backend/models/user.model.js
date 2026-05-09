const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'pharmacist', 'patient'], default: 'patient', index: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  phoneNumber: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null }
}, { timestamps: true, collection: 'users' }));
schema.virtual('id').get(function () { return this._id.toString(); });
module.exports = mongoose.model('User', schema);
