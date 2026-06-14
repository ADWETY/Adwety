'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'j'.repeat(80);
process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(80);
process.env.CSRF_SECRET = 'c'.repeat(80);
process.env.OTP_HASH_SECRET = 'o'.repeat(80);
process.env.PASSWORD_PEPPER = 'p'.repeat(80);
process.env.DATA_ENCRYPTION_KEY = 'd'.repeat(80);
process.env.MFA_ENCRYPTION_KEY = 'm'.repeat(80);

const { StoreSequence } = require('../models');
const { nextRetailNumber } = require('../services/retail-number.service');
const { removeLegacyGlobalNumberIndex, removeObsoleteUniqueIndexes } = require('../services/retail-indexes.service');
const { normalizeMongoError } = require('../middleware/error');

test('tenant document numbering uses an atomic counter and skips occupied legacy values', async () => {
  const originalCounter = StoreSequence.findOneAndUpdate;
  let value = 0;
  let firstCounterCreate = true;
  StoreSequence.findOneAndUpdate = async () => {
    if (firstCounterCreate) {
      firstCounterCreate = false;
      const duplicate = new Error('counter race');
      duplicate.code = 11000;
      throw duplicate;
    }
    return { value: ++value };
  };
  const checked = [];
  const Model = {
    exists: async ({ number }) => {
      checked.push(number);
      return number === 'SAL-0001';
    },
  };

  try {
    const number = await nextRetailNumber(Model, 'SAL', 'invoice:sale');
    assert.equal(number, 'SAL-0002');
    assert.deepEqual(checked, ['SAL-0001', 'SAL-0002']);
  } finally {
    StoreSequence.findOneAndUpdate = originalCounter;
  }
});

test('legacy global number index is removed without touching compound tenant indexes', async () => {
  const dropped = [];
  const Model = {
    collection: {
      collectionName: 'store_invoices',
      indexes: async () => [
        { name: '_id_', key: { _id: 1 }, unique: true },
        { name: 'number_1', key: { number: 1 }, unique: true },
        { name: 'pharmacyId_1_number_1', key: { pharmacyId: 1, number: 1 }, unique: true },
      ],
      dropIndex: async (name) => dropped.push(name),
    },
  };

  const removed = await removeLegacyGlobalNumberIndex(Model);
  assert.deepEqual(dropped, ['number_1']);
  assert.deepEqual(removed, ['store_invoices.number_1']);
});



test('obsolete global retail unique indexes are removed while tenant indexes are preserved', async () => {
  const dropped = [];
  const Model = {
    schema: {
      indexes: () => [
        [{ pharmacyId: 1, code: 1 }, { unique: true }],
        [{ name: 'text', code: 'text' }, {}],
      ],
    },
    collection: {
      collectionName: 'store_warehouses',
      indexes: async () => [
        { name: '_id_', key: { _id: 1 }, unique: true },
        { name: 'code_1', key: { code: 1 }, unique: true },
        { name: 'pharmacyId_1_code_1', key: { pharmacyId: 1, code: 1 }, unique: true },
        { name: 'name_text_code_text', key: { name: 'text', code: 'text' } },
      ],
      dropIndex: async (name) => dropped.push(name),
    },
  };

  const removed = await removeObsoleteUniqueIndexes(Model);
  assert.deepEqual(dropped, ['code_1']);
  assert.deepEqual(removed, ['store_warehouses.code_1']);
});

test('Mongo duplicate errors are converted to a safe 409 response', () => {
  const error = normalizeMongoError({
    code: 11000,
    keyPattern: { number: 1 },
    message: 'raw database details must not leak',
  });
  assert.equal(error.statusCode, 409);
  assert.equal(error.message, 'Document number already exists');
  assert.equal(error.details.code, 'DUPLICATE_KEY');
});
