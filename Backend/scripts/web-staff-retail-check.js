'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const authRoutes = read('routes/auth.routes.js');
const mobileAuthRoutes = read('routes/flutter/auth.routes.js');
const routeIndex = read('routes/index.js');
const retailRoutes = read('routes/retail.routes.js');
const legacyRoutes = read('routes/legacy-dashboard.routes.js');
const authController = read('controllers/auth.controller.js');
const loginService = read('services/login.service.js');
const tenantMiddleware = read('middleware/retail-tenant.js');
const tenantPlugin = read('models/retail-tenant.plugin.js');

assert.doesNotMatch(authRoutes, /router\.post\(['"]\/register['"]/);
assert.match(mobileAuthRoutes, /router\.post\(['"]\/register['"]/);
assert.match(authController, /allowedRoles:\s*\[['"]admin['"],['"]pharmacist['"]\]/);
assert.match(loginService, /WEB_ACCESS_DENIED/);
assert.doesNotMatch(routeIndex, /router\.use\(['"]\/(?:prescriptions|ai)['"]/);
assert.match(routeIndex, /router\.use\(['"]\/retail['"],\s*auth,\s*auth\.authorize\(\[['"]admin['"],\s*['"]pharmacist['"]\]\),\s*retailRoutes/);
assert.match(retailRoutes, /router\.use\(retailTenant\)/);
assert.match(legacyRoutes, /WEB_FEATURE_REMOVED/);
assert.doesNotMatch(legacyRoutes, /controller\.scanPrescription/);
assert.match(tenantMiddleware, /req\.authRole === 'admin'/);
assert.match(tenantMiddleware, /X-Pharmacy-ID/);
assert.match(tenantMiddleware, /RETAIL_PHARMACY_REQUIRED/);
assert.match(tenantMiddleware, /ownerId:\s*user\._id/);
assert.match(tenantPlugin, /Cross-pharmacy retail access is forbidden/);

const tenantModels = [
  'store-category.model.js',
  'store-warehouse.model.js',
  'store-product.model.js',
  'store-person.model.js',
  'store-invoice.model.js',
  'store-return.model.js',
  'store-transfer.model.js',
  'store-inventory-count.model.js',
  'store-treasury-movement.model.js',
];
for (const file of tenantModels) {
  assert.match(read(`models/${file}`), /applyRetailTenant\(schema\)/, `${file} must use retail tenancy`);
}

console.log('Web role scope checks passed: admin/pharmacist only, mobile patient preserved, scanner web routes removed, pharmacist data isolated, and admin retail access requires an explicit pharmacy tenant.');
