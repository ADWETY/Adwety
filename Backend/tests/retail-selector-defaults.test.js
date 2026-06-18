'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const models = require('../models');
const { ensureRetailDefaults } = require('../middleware/retail-tenant');

const modelEntries = [
  ['warehouse', models.StoreWarehouse],
  ['person', models.StorePerson],
  ['category', models.StoreCategory],
];

test('pharmacist retail bootstrap creates selector prerequisites in the same pharmacy tenant', async () => {
  const calls = [];
  const originals = new Map();

  for (const [name, Model] of modelEntries) {
    originals.set(Model, Model.findOneAndUpdate);
    Model.findOneAndUpdate = async (filter, update, options) => {
      calls.push({ name, filter, update, options });
      return { ...filter, ...(update.$setOnInsert || {}) };
    };
  }

  try {
    const pharmacy = { _id: '507f1f77bcf86cd799439011', name: 'Demo Pharmacy' };
    const req = { authUser: { fullName: 'Demo Pharmacist', phoneNumber: '01000000000' } };
    await ensureRetailDefaults(req, pharmacy);

    assert.equal(calls.length, 4);
    assert.equal(calls.filter((call) => call.name === 'warehouse').length, 1);
    assert.equal(calls.filter((call) => call.name === 'category').length, 1);
    assert.equal(calls.filter((call) => call.name === 'person').length, 2);

    for (const call of calls) {
      assert.equal(String(call.filter.pharmacyId), String(pharmacy._id));
      assert.equal(String(call.update.$setOnInsert.pharmacyId), String(pharmacy._id));
      assert.equal(call.options.upsert, true);
      assert.equal(call.options.runValidators, true);
    }

    const customer = calls.find((call) => call.filter.type === 'customer');
    const supplier = calls.find((call) => call.filter.type === 'supplier');
    assert.equal(customer.update.$setOnInsert.status, 'active');
    assert.equal(supplier.update.$setOnInsert.status, 'active');
  } finally {
    for (const [, Model] of modelEntries) {
      Model.findOneAndUpdate = originals.get(Model);
    }
  }
});
