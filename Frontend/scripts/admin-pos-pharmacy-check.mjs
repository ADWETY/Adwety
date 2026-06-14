import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [api, store, app, selector, retailPages] = await Promise.all([
  readFile(new URL('../src/lib/api.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/retailStore.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/RetailPharmacySelector.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/retail/RetailPages.jsx', import.meta.url), 'utf8'),
]);

assert.match(api, /headers\['X-Pharmacy-ID'\]\s*=\s*pharmacyId/);
assert.match(api, /RETAIL_PHARMACY_STORAGE_KEY/);
assert.match(api, /retailTenantKey/);
assert.match(store, /requiresPharmacySelection\s*=\s*isAdminRetail\s*&&\s*!selectedPharmacyId/);
assert.match(store, /Select a pharmacy before saving/);
assert.match(store, /loadRetailDataFromApi\(\{ force: true, pharmacyId: tenantId \}\)/);
assert.match(app, /<RetailPharmacySelector\s*\/>/);
assert.match(app, /workspaceKey/);
assert.match(selector, /اختيار الصيدلية/);
assert.match(selector, /disabled=\{isLoadingPharmacies \|\| isSaving\}/);
assert.match(retailPages, /requiresPharmacySelection \|\| !warehouseId \|\| !items\.length/);

console.log('Admin POS pharmacy selection checks passed (11 assertions).');
