'use strict';

const { mongoose, withJsonTransform } = require('./base.model');
const applyRetailTenant = require('./retail-tenant.plugin');

const schema = withJsonTransform(new mongoose.Schema({
  key: { type: String, required: true, trim: true, maxlength: 120 },
  value: { type: Number, default: 0, min: 0 },
}, { timestamps: true, collection: 'store_sequences' }));

applyRetailTenant(schema);

schema.index({ pharmacyId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('StoreSequence', schema);
