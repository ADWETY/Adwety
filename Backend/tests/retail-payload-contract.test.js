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

const retail = require('../controllers/retail.controller');
const admin = require('../controllers/admin.controller');

const id = '64b000000000000000000001';
const id2 = '64b000000000000000000002';

function assertPayload(schema, body, params = {}) {
  const parsed = schema.safeParse({ body, query: {}, params });
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues || []));
}

test('all retail add and save payloads produced by the frontend satisfy backend schemas', () => {
  assertPayload(retail.createCategorySchema, { name: 'Test', description: 'Desc', status: 'active' });
  assertPayload(retail.updateCategorySchema, { name: 'Updated' }, { id });

  assertPayload(retail.createWarehouseSchema, { name: 'Main', code: 'MAIN', address: '', manager: '', phone: '', status: 'active' });
  assertPayload(retail.updateWarehouseSchema, { name: 'Main 2' }, { id });

  assertPayload(retail.createPersonSchema, { name: 'Person', phone: '', email: '', address: '', openingBalance: 0, balanceType: 'debit', notes: '', status: 'active' });
  assertPayload(retail.updatePersonSchema, { name: 'Person 2' }, { id });

  assertPayload(retail.createProductSchema, {
    code: 'P1', barcode: '', name: 'Product', categoryId: id, unit: 'Piece', unitFactor: 1,
    purchasePrice: 10, salePrice: 20, minStock: 2, stock: { [id2]: 5 },
    units: [{ name: 'Piece', factor: 1, salePrice: 20 }], supplierId: null, notes: '', status: 'active',
  });
  assertPayload(retail.updateProductSchema, { salePrice: 22, units: [{ name: 'Piece', factor: 1, salePrice: 22 }] }, { id });

  assertPayload(retail.createInvoiceSchema, {
    date: '2026-06-14', warehouseId: id, customerId: id2, supplierId: null,
    paymentMethod: 'cash', discount: 0, paid: 20, notes: '',
    items: [{ productId: id2, unit: 'Piece', unitFactor: 1, qty: 1, price: 20, discount: 0 }],
  });
  assertPayload(retail.updateInvoiceSchema, {
    paid: 10,
    items: [{ productId: id2, unit: 'Piece', unitFactor: 1, qty: 1, price: 20, discount: 0 }],
  }, { id });

  assertPayload(retail.createReturnSchema, {
    kind: 'sales', date: '2026-06-14', invoiceId: id, warehouseId: id2,
    customerId: null, supplierId: null, reason: '', refund: 20,
    items: [{ productId: id, qty: 1, price: 20, discount: 0 }],
  });
  assertPayload(retail.updateReturnSchema, { reason: 'Updated' }, { id });

  assertPayload(retail.createTransferSchema, {
    date: '2026-06-14', fromWarehouseId: id, toWarehouseId: id2,
    notes: '', status: 'completed', items: [{ productId: id, qty: 1 }],
  });
  assertPayload(retail.updateTransferSchema, { notes: 'Updated' }, { id });

  assertPayload(retail.createCountSchema, {
    date: '2026-06-14', warehouseId: id, notes: '', status: 'applied',
    items: [{ productId: id2, countedQty: 4 }],
  });
  assertPayload(retail.updateCountSchema, { notes: 'Updated' }, { id });

  assertPayload(retail.createTreasurySchema, {
    date: '2026-06-14', type: 'income', category: 'Manual', amount: 100,
    description: '', warehouseId: id, sourceType: 'manual',
  });
  assertPayload(retail.updateTreasurySchema, { amount: 125 }, { id });
});

test('admin pharmacy and medicine add payloads satisfy backend schemas', () => {
  assertPayload(admin.createPharmacySchema, {
    name: 'Pharmacy', address: 'Cairo', phone: '010', email: 'p@example.com', status: 'active',
    latitude: 30, longitude: 31, workingHours: '', rating: 0, googleMapsUrl: '',
  });
  assertPayload(admin.createDrugSchema, {
    genericName: 'Drug', category: 'General', dosageForm: 'Tablet', strength: '10mg',
    description: '', brandNames: [], aliases: [], isActive: true,
  });
  assertPayload(admin.createInventorySchema, { pharmacyId: id, drugId: id2, quantity: 5, price: 10 });
});
