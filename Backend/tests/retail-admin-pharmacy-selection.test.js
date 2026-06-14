'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Pharmacy, StoreWarehouse, StorePerson, StoreCategory } = require('../models');
const retailTenant = require('../middleware/retail-tenant');
const { getRetailTenantId } = require('../services/retail-tenant.service');

const PHARMACY_ID = '66b1234567890abcdef12345';

function requestWithHeader(value) {
  return {
    authRole: 'admin',
    authUser: { _id: '66b1234567890abcdef99999', fullName: 'Admin User', phoneNumber: '' },
    get(name) {
      return String(name).toLowerCase() === 'x-pharmacy-id' ? value : '';
    },
  };
}

function invoke(req) {
  return new Promise((resolve, reject) => {
    retailTenant(req, {}, (error) => {
      if (error) resolve({ error, req, tenantId: getRetailTenantId() });
      else resolve({ error: null, req, tenantId: getRetailTenantId() });
    }).catch(reject);
  });
}

test('admin retail access is rejected until a pharmacy is explicitly selected', async () => {
  const result = await invoke(requestWithHeader(''));
  assert.equal(result.error?.statusCode, 400);
  assert.equal(result.error?.details?.code, 'RETAIL_PHARMACY_REQUIRED');
  assert.equal(result.req.retailPharmacyId, undefined);
});

test('admin retail access rejects malformed pharmacy identifiers', async () => {
  const result = await invoke(requestWithHeader('not-an-object-id'));
  assert.equal(result.error?.statusCode, 400);
  assert.equal(result.error?.details?.code, 'RETAIL_PHARMACY_INVALID');
});

test('admin selection establishes the chosen pharmacy tenant before retail controllers run', async () => {
  const originalFindOne = Pharmacy.findOne;
  const originalWarehouse = StoreWarehouse.findOneAndUpdate;
  const originalPerson = StorePerson.findOneAndUpdate;
  const originalCategory = StoreCategory.findOneAndUpdate;

  Pharmacy.findOne = () => ({
    select() { return this; },
    async lean() { return { _id: PHARMACY_ID, name: 'Selected Pharmacy', status: 'active', ownerId: null }; },
  });
  StoreWarehouse.findOneAndUpdate = async () => ({ _id: 'warehouse' });
  StorePerson.findOneAndUpdate = async () => ({ _id: 'person' });
  StoreCategory.findOneAndUpdate = async () => ({ _id: 'category' });

  try {
    const result = await invoke(requestWithHeader(PHARMACY_ID));
    assert.equal(result.error, null);
    assert.equal(String(result.req.retailPharmacyId), PHARMACY_ID);
    assert.equal(result.req.retailPharmacy.name, 'Selected Pharmacy');
    assert.equal(result.tenantId, PHARMACY_ID);
  } finally {
    Pharmacy.findOne = originalFindOne;
    StoreWarehouse.findOneAndUpdate = originalWarehouse;
    StorePerson.findOneAndUpdate = originalPerson;
    StoreCategory.findOneAndUpdate = originalCategory;
  }
});
