'use strict';

const { AsyncLocalStorage } = require('async_hooks');

const retailTenantStorage = new AsyncLocalStorage();

function runWithRetailTenant(pharmacyId, callback) {
  const normalized = pharmacyId ? String(pharmacyId) : null;
  return retailTenantStorage.run({ pharmacyId: normalized }, callback);
}

function getRetailTenantId() {
  return retailTenantStorage.getStore()?.pharmacyId || null;
}

module.exports = {
  runWithRetailTenant,
  getRetailTenantId,
};
