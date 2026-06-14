import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const storage = read('src/lib/storage.js');
const api = read('src/lib/api.js');
const boundary = read('src/components/ErrorBoundary.jsx');
const headers = read('public/_headers');
const nginx = read('deploy/nginx.conf');

const app = read('src/App.jsx');
const roles = read('src/lib/roles.js');
const sidebar = read('src/components/Sidebar.jsx');
assert.doesNotMatch(app, /PrescriptionScannerPage|RegisterPage/);
assert.match(app, /path="\/register"[\s\S]*Navigate to="\/login"/);
assert.match(app, /path="scanner"[\s\S]*Navigate to="\/"/);
assert.match(roles, /web:\s*\['admin',\s*'pharmacist'\]/);
assert.match(roles, /retail:\s*\['admin',\s*'pharmacist'\]/);
assert.doesNotMatch(sidebar, /nav\.scanner|to:\s*['"]\/scanner/);
assert.match(api, /`\/retail\$\{pathname\}/);

assert.doesNotMatch(storage, /localStorage\.setItem\([^\n]*(?:token|Token)/);
assert.doesNotMatch(storage, /export function (?:set|get)StoredToken/);
assert.match(storage, /purgeLegacyTokenStorage/);
assert.doesNotMatch(api, /Authorization\s*=/);
assert.match(api, /credentials:\s*'include'/);
assert.match(api, /X-CSRF-Token/);
assert.match(api, /refreshBrowserSession/);
assert.match(api, /response\.status === 401/);
assert.match(boundary, /postJson\('\/auth\/logout'/);
assert.match(boundary, /clearAuthStorage/);
assert.match(headers, /Content-Security-Policy/);
assert.match(headers, /script-src 'self'/);
assert.match(nginx, /frame-ancestors 'none'/);

const utils = await import(pathToFileURL(path.join(root, 'src/lib/utils.js')).href);
assert.equal(utils.safeCsvCell('=HYPERLINK("https://evil.example")').startsWith("'="), true);
assert.equal(utils.safeCsvCell('  +SUM(A1:A2)').startsWith("'"), true);
assert.equal(utils.safeCsvCell('\t@cmd').startsWith("'"), true);
assert.equal(utils.safeCsvCell(-42), '-42');

console.log('Frontend security checks passed: staff-only web roles, no web prescription upload, tenant retail routing, cookie sessions, CSRF, silent refresh, CSV hardening, and CSP headers.');
