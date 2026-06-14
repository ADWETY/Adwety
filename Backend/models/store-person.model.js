const { mongoose, withJsonTransform } = require('./base.model');

const schema = withJsonTransform(new mongoose.Schema({
  type: { type: String, enum: ['customer', 'supplier'], required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  phone: { type: String, default: '', maxlength: 40 },
  email: { type: String, default: '', lowercase: true, trim: true, maxlength: 254 },
  address: { type: String, default: '', maxlength: 600 },
  openingBalance: { type: Number, default: 0, min: 0 },
  balanceType: { type: String, enum: ['debit', 'credit'], default: 'debit' },
  notes: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 'store_people' }));

schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ type: 1, status: 1 });
schema.index({ name: 'text', phone: 'text', email: 'text', address: 'text' });

module.exports = mongoose.model('StorePerson', schema);
