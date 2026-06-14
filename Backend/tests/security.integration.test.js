'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const testMongoUri = process.env.TEST_MONGODB_URI || '';
if (!testMongoUri) {
  test('security integration suite requires TEST_MONGODB_URI', { skip: true }, () => {});
  return;
}

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = testMongoUri;
process.env.REDIS_REQUIRED = 'false';
process.env.CLAMAV_REQUIRED = 'false';
process.env.PASSWORD_BREACH_CHECK = 'off';
process.env.TRUST_PROXY = 'false';
process.env.TRUST_PROXY_REQUIRED = 'false';
process.env.ENABLE_API_ALIAS = 'true';
process.env.ENABLE_MOBILE_V1_ALIAS = 'true';
process.env.ENABLE_LEGACY_DASHBOARD_ROUTES = 'true';
process.env.ENABLE_DASHBOARD_ALIAS = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'j'.repeat(64);
process.env.OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || 'o'.repeat(64);
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'r'.repeat(64);
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'c'.repeat(64);
process.env.PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'p'.repeat(64);
process.env.DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'd'.repeat(64);
process.env.MFA_ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'm'.repeat(64);

const mongoose = require('mongoose');
const { createApp } = require('../app');
const {
  User,
  Pharmacy,
  Drug,
  InventorySnapshot,
  Notification,
  Session
} = require('../models');
const { hashPassword } = require('../services/password.service');
const { createSessionTokens } = require('../services/session.service');

let server;
let base;
let users;
let pharmacies;
let drug;
let tokens;

async function http(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    redirect: 'manual',
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  let body = null;
  try { body = await response.json(); } catch (_) { body = null; }
  return { response, body };
}

function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

async function issue(user, admin = false) {
  const req = { ip: '127.0.0.1', headers: { 'user-agent': 'security-integration-test' } };
  return createSessionTokens(user, req, { mfaVerifiedAt: admin ? new Date() : null });
}

before(async () => {
  await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 10_000 });
  await mongoose.connection.db.dropDatabase();

  const passwordHash = await hashPassword('Unique-integration-password-2026!', {
    email: 'seed@example.com',
    fullName: 'Seed User'
  });
  const [admin, pharmacistA, pharmacistB, patient] = await User.create([
    { fullName: 'Admin', email: 'admin@example.com', passwordHash, role: 'admin', mfaEnabled: true },
    { fullName: 'Pharmacist A', email: 'pharma-a@example.com', passwordHash, role: 'pharmacist' },
    { fullName: 'Pharmacist B', email: 'pharma-b@example.com', passwordHash, role: 'pharmacist' },
    { fullName: 'Patient', email: 'patient@example.com', passwordHash, role: 'patient' }
  ]);

  const [pharmacyA, pharmacyB] = await Pharmacy.create([
    { name: 'Pharmacy A', address: 'Address A', status: 'active', ownerId: pharmacistA._id },
    { name: 'Pharmacy B', address: 'Address B', status: 'active', ownerId: pharmacistB._id }
  ]);
  pharmacistA.pharmacyId = pharmacyA._id;
  pharmacistB.pharmacyId = pharmacyB._id;
  await Promise.all([pharmacistA.save(), pharmacistB.save()]);

  drug = await Drug.create({
    genericName: 'Paracetamol',
    brandNames: ['Panadol'],
    aliases: [],
    category: 'Painkiller',
    dosageForm: 'Tablet',
    strength: '500mg',
    isActive: true
  });
  await InventorySnapshot.create([
    { pharmacyId: pharmacyA._id, drugId: drug._id, quantity: 10, price: 20 },
    { pharmacyId: pharmacyB._id, drugId: drug._id, quantity: 15, price: 25 }
  ]);

  users = { admin, pharmacistA, pharmacistB, patient };
  pharmacies = { pharmacyA, pharmacyB };
  tokens = {
    admin: await issue(admin, true),
    pharmacistA: await issue(pharmacistA),
    pharmacistB: await issue(pharmacistB),
    patient: await issue(patient)
  };

  const app = createApp();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

test('patient cannot access analytics on canonical or deprecated mobile routes', async () => {
  for (const pathname of ['/api/v1/mobile/analytics', '/v1/analytics']) {
    const result = await http(pathname, { method: 'GET', headers: bearer(tokens.patient.access_token) });
    assert.equal(result.response.status, 403, pathname);
  }
});

test('admin with recent MFA can access mobile analytics', async () => {
  const result = await http('/api/v1/mobile/analytics', {
    method: 'GET',
    headers: bearer(tokens.admin.access_token)
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.users >= 4, true);
});

test('registration mass assignment is rejected on every active alias', async () => {
  const endpoints = ['/api/v1/auth/register', '/api/auth/register', '/api/v1/mobile/auth/register', '/v1/auth/register'];
  for (const [index, pathname] of endpoints.entries()) {
    const result = await http(pathname, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Attacker',
        email: `mass-${index}-${crypto.randomUUID()}@example.com`,
        password: 'Unique-mass-assignment-password-2026!',
        role: 'admin'
      })
    });
    assert.equal(result.response.status, 422, pathname);
  }
});

test('pharmacist cannot switch pharmacy IDs on canonical or legacy inventory paths', async () => {
  const listResult = await http(`/api/v1/inventory?pharmacyId=${pharmacies.pharmacyB._id}`, {
    method: 'GET',
    headers: bearer(tokens.pharmacistA.access_token)
  });
  assert.equal(listResult.response.status, 403);

  const syncResult = await http('/api/v1/inventory/sync', {
    method: 'POST',
    headers: bearer(tokens.pharmacistA.access_token),
    body: JSON.stringify({
      pharmacyId: String(pharmacies.pharmacyB._id),
      inventory: [{ drugId: String(drug._id), quantity: 999, price: 1 }]
    })
  });
  assert.equal(syncResult.response.status, 403);

  const untouched = await InventorySnapshot.findOne({ pharmacyId: pharmacies.pharmacyB._id, drugId: drug._id }).lean();
  assert.equal(untouched.quantity, 15);
});

test('pharmacist cannot self-approve a pharmacy or assign owner fields', async () => {
  const result = await http(`/api/v1/pharmacies/${pharmacies.pharmacyA._id}`, {
    method: 'PATCH',
    headers: bearer(tokens.pharmacistA.access_token),
    body: JSON.stringify({ status: 'active', ownerId: users.pharmacistB._id })
  });
  assert.equal(result.response.status, 422);
  const row = await Pharmacy.findById(pharmacies.pharmacyA._id).lean();
  assert.equal(String(row.ownerId), String(users.pharmacistA._id));
});

test('notification read endpoint persists state and enforces ownership', async () => {
  const own = await Notification.create({
    title: 'Own notification',
    message: 'Read me',
    audience: 'patient',
    recipientUserId: users.patient._id
  });
  const other = await Notification.create({
    title: 'Other notification',
    message: 'Not yours',
    audience: 'patient',
    recipientUserId: users.pharmacistA._id
  });

  const read = await http(`/api/v1/mobile/notifications/${own._id}/read`, {
    method: 'PATCH',
    headers: bearer(tokens.patient.access_token),
    body: '{}'
  });
  assert.equal(read.response.status, 200);
  const saved = await Notification.findById(own._id).lean();
  assert.equal(saved.readBy.map(String).includes(String(users.patient._id)), true);

  const forbiddenObject = await http(`/api/v1/mobile/notifications/${other._id}/read`, {
    method: 'PATCH',
    headers: bearer(tokens.patient.access_token),
    body: '{}'
  });
  assert.equal(forbiddenObject.response.status, 404);
});

test('deprecated aliases emit lifecycle headers', async () => {
  const result = await http('/api/meta', { method: 'GET' });
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get('deprecation'), 'true');
  assert.match(result.response.headers.get('link') || '', /api\/v1/);
});

test('all issued test sessions remain tenant-specific', async () => {
  const sessionRows = await Session.find({ userId: { $in: Object.values(users).map((u) => u._id) } }).lean();
  assert.equal(sessionRows.length >= 4, true);
  assert.equal(new Set(sessionRows.map((s) => String(s.userId))).size, 4);
});
