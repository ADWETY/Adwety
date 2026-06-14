'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authController = require('../controllers/auth.controller');
const flutterSchemas = require('../controllers/flutter/schemas');
const pharmacyController = require('../controllers/pharmacy.controller');
const pharmaciesController = require('../controllers/pharmacies.controller');
const inventoryController = require('../controllers/inventory.controller');

function mustReject(schema, value, label) {
  const result = schema.safeParse(value);
  assert.equal(result.success, false, `${label} must be rejected`);
}
function mustAccept(schema, value, label) {
  const result = schema.safeParse(value);
  assert.equal(result.success, true, `${label} must be accepted: ${JSON.stringify(result.error?.issues || [])}`);
}
function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const registration = {
  body: { name: 'Security Tester', email: 'security@example.com', password: 'Password123!' },
  query: {},
  params: {}
};
mustAccept(authController.registerSchema, registration, 'main public registration');
mustReject(authController.registerSchema, { ...registration, body: { ...registration.body, role: 'admin' } }, 'main registration role mass assignment');
mustAccept(flutterSchemas.registerSchema, registration, 'mobile public registration');
mustReject(flutterSchemas.registerSchema, { ...registration, body: { ...registration.body, role: 'admin' } }, 'mobile registration role mass assignment');

mustAccept(pharmacyController.myInventorySchema, { body: {}, query: {}, params: {} }, 'my inventory request');
mustReject(pharmacyController.myInventorySchema, { body: {}, query: { pharmacyId: '507f1f77bcf86cd799439011' }, params: {} }, 'my inventory user-controlled pharmacyId');
mustReject(pharmaciesController.listSchema, { body: {}, query: { status: 'pending' }, params: {} }, 'public pharmacy status enumeration');

mustAccept(inventoryController.syncSchema, {
  body: { inventory: [{ drugId: '507f1f77bcf86cd799439011', quantity: 1, price: 10 }] },
  query: {},
  params: {}
}, 'pharmacist JWT-derived inventory sync payload');

mustReject(pharmaciesController.pharmacistCreateSchema, {
  body: { name: 'Test Pharmacy', address: 'Test address', status: 'active' }, query: {}, params: {}
}, 'pharmacist create status property');
mustReject(pharmaciesController.pharmacistUpdateSchema, {
  body: { status: 'approved' }, query: {}, params: { id: '507f1f77bcf86cd799439011' }
}, 'pharmacist self-approval status property');
mustReject(pharmaciesController.pharmacistUpdateSchema, {
  body: { ownerId: '507f1f77bcf86cd799439012' }, query: {}, params: { id: '507f1f77bcf86cd799439011' }
}, 'pharmacist owner reassignment property');

const drugRoutes = source('routes/drugs.routes.js');
const legacyRoutes = source('routes/legacy-dashboard.routes.js');
const pharmacyRoutes = source('routes/pharmacy.routes.js');
const drugsController = source('controllers/drugs.controller.js');
const pharmaciesSource = source('controllers/pharmacies.controller.js');
const otpService = source('services/otp.service.js');
const authSource = source('controllers/auth.controller.js');
const profileSource = source('controllers/profile.controller.js');
const flutterRoutes = source('routes/flutter.routes.js');
const aiRoutes = source('routes/ai.routes.js');
const compose = source('docker-compose.yml');

assert.match(drugRoutes, /router\.post\('\/'\s*,\s*auth\s*,\s*auth\.authorize\(\['admin'\]\)/, 'POST /api/drugs must have admin RBAC');
assert.match(drugRoutes, /router\.put\('\/:id'\s*,\s*auth\s*,\s*auth\.authorize\(\['admin'\]\)/, 'PUT /api/drugs/:id must have admin RBAC');
assert.match(legacyRoutes, /router\.post\('\/medicines'\s*,\s*auth\s*,\s*auth\.authorize\(\['admin'\]\)/, 'legacy medicine creation must have admin RBAC');
assert.match(legacyRoutes, /router\.put\('\/medicines\/:id'\s*,\s*auth\s*,\s*auth\.authorize\(\['admin'\]\)/, 'legacy medicine update must have admin RBAC');
assert.match(pharmacyRoutes, /auth\.authorize\(\['pharmacist'\]\)/, 'my inventory must be pharmacist-only');
assert.match(drugsController, /Drug\.create\(\{ \.\.\.data, isActive: true \}\)/, 'drug creation must remain active');
assert.match(drugsController, /drug\.isActive = true/, 'drug update must remain active');
assert.match(pharmaciesSource, /const projection = 'name address phone status latitude longitude location workingHours googleMapsUrl rating'/, 'public pharmacy projection must be explicit');
assert.doesNotMatch(pharmaciesSource.match(/function serializePublic[\s\S]*?\n}/)?.[0] || '', /owner_id|ownerId|created_at|createdAt|updated_at|updatedAt|email/, 'public pharmacy serializer must not expose internal fields');

assert.match(otpService, /crypto\.randomInt\(100000, 1000000\)/, 'OTP must use cryptographically secure randomInt');
assert.match(otpService, /createHmac\('sha256', env\.otpHashSecret\)/, 'OTP must be stored as a keyed hash');
assert.doesNotMatch(authSource + profileSource, /jwt\.sign|signOtpToken|otp_code/, 'OTP must not be placed in a client-visible JWT or response');
assert.match(authSource, /otp_token: requestId/, 'legacy otp_token field must only be an opaque request id');

assert.match(legacyRoutes, /router\.get\('\/inventory', auth, auth\.authorize\(\['admin','pharmacist'\]\)/, 'legacy inventory listing must require explicit RBAC');
assert.match(legacyRoutes, /router\.post\('\/inventory\/sync', auth, auth\.authorize\(\['admin','pharmacist'\]\)/, 'legacy inventory sync must require explicit RBAC');
assert.match(source('controllers/legacy-dashboard.controller.js'), /pharmacists cannot access another pharmacy inventory/, 'legacy inventory must reject cross-tenant pharmacyId');

assert.doesNotMatch(flutterRoutes, /prescription'.*auth\.optional|prescription",.*auth\.optional/, 'Flutter AI routes must require authentication');
assert.match(aiRoutes, /auth, aiRateLimiter, aiDailyQuota/, 'AI route must enforce authentication, rate limiting and daily quota');

assert.doesNotMatch(compose, /JWT_SECRET:\s*adwety-|27018:27017/, 'Compose must not contain hard-coded JWT secret or exposed MongoDB port');
assert.match(compose, /JWT_SECRET_FILE:\s*\/run\/secrets\/jwt_secret/, 'Compose must load JWT from Docker secrets');
assert.match(compose, /MONGO_INITDB_ROOT_PASSWORD_FILE/, 'MongoDB authentication must use a secret file');
assert.match(compose, /user:\s*"node"/, 'Backend container must run as non-root');
assert.match(compose, /no-new-privileges:true/, 'Backend container must disable privilege escalation');

console.log('Security regression checks passed: original report + five critical hardening areas.');
