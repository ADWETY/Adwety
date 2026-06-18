'use strict';

const { mongoose } = require('./base.model');
const { getRetailTenantId } = require('../services/retail-tenant.service');

const QUERY_OPERATIONS = [
  'countDocuments',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndReplace',
  'findOneAndUpdate',
  'replaceOne',
  'updateMany',
  'updateOne',
];

function tenantObjectId() {
  const value = getRetailTenantId();
  return value ? new mongoose.Types.ObjectId(value) : null;
}

function applyRetailTenant(schema) {
  schema.add({
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      default: null,
      index: true,
    },
  });

  schema.pre(QUERY_OPERATIONS, function applyQueryTenant(next) {
    const tenantId = tenantObjectId();
    if (tenantId) this.where({ pharmacyId: tenantId });
    next();
  });

  schema.pre('aggregate', function applyAggregateTenant(next) {
    const tenantId = tenantObjectId();
    if (tenantId) this.pipeline().unshift({ $match: { pharmacyId: tenantId } });
    next();
  });

  schema.pre('validate', function applyDocumentTenant(next) {
    const tenantId = tenantObjectId();
    if (!tenantId) return next();
    if (this.pharmacyId && String(this.pharmacyId) !== String(tenantId)) {
      return next(new Error('Cross-pharmacy retail access is forbidden'));
    }
    this.pharmacyId = tenantId;
    return next();
  });

  schema.pre('insertMany', function applyInsertManyTenant(next, docs) {
    const tenantId = tenantObjectId();
    if (tenantId) {
      for (const doc of docs || []) {
        if (doc.pharmacyId && String(doc.pharmacyId) !== String(tenantId)) {
          return next(new Error('Cross-pharmacy retail access is forbidden'));
        }
        doc.pharmacyId = tenantId;
      }
    }
    return next();
  });
}

module.exports = applyRetailTenant;
