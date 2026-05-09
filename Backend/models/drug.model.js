const { mongoose, withJsonTransform } = require('./base.model');
const schema = withJsonTransform(new mongoose.Schema({
  genericName: { type: String, required: true, trim: true },
  brandNames: [{ type: String, trim: true }],
  aliases: [{ type: String, trim: true }],
  category: { type: String, required: true, trim: true, default: 'General' },
  dosageForm: { type: String, required: true, trim: true },
  strength: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  searchText: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'drugs' }));
schema.pre('save', function buildSearchText(next) {
  this.searchText = [this.genericName, ...(this.brandNames || []), ...(this.aliases || []), this.category, this.dosageForm, this.strength]
    .filter(Boolean).join(' ').toLowerCase();
  next();
});
schema.virtual('id').get(function () { return this._id.toString(); });
schema.index({ genericName: 'text', brandNames: 'text', aliases: 'text', category: 'text', dosageForm: 'text', strength: 'text', searchText: 'text' });
schema.index({ category: 1, isActive: 1 });
module.exports = mongoose.model('Drug', schema);
