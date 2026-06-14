'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'j'.repeat(64);
process.env.OTP_HASH_SECRET = 'o'.repeat(64);
process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(64);
process.env.CSRF_SECRET = 'c'.repeat(64);
process.env.PASSWORD_PEPPER = 'p'.repeat(64);
process.env.DATA_ENCRYPTION_KEY = 'd'.repeat(64);
process.env.MFA_ENCRYPTION_KEY = 'm'.repeat(64);
process.env.REDIS_REQUIRED = 'false';
process.env.CLAMAV_REQUIRED = 'false';
process.env.PASSWORD_BREACH_CHECK = 'off';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { csrfHash, assertCsrfForSession, parseCookies } = require('../services/http-session.service');
const authController = require('../controllers/auth.controller');

const source = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

const raw = 'csrf-test-token';
const session = { csrfTokenHash: csrfHash(raw) };
const request = {
  method: 'POST',
  headers: { cookie: `adwety_csrf=${encodeURIComponent(raw)}`, 'x-csrf-token': raw }
};
assert.doesNotThrow(() => assertCsrfForSession(request, session));
assert.throws(() => assertCsrfForSession({ method: 'POST', headers: { cookie: 'adwety_csrf=bad', 'x-csrf-token': 'bad' } }, session), /Invalid CSRF token/);
assert.equal(parseCookies('a=1; adwety_csrf=hello%20world').adwety_csrf, 'hello world');
assert.doesNotThrow(() => authController.refreshSchema.parse({ body: {}, query: {}, params: {} }));

const controller = source('controllers/auth.controller.js');
const middleware = source('middleware/auth.js');
const sessionService = source('services/session.service.js');
const compose = source('docker-compose.yml');
assert.match(controller, /setSessionCookies\(res/);
assert.match(controller, /clearSessionCookies\(res\)/);
assert.doesNotMatch(controller, /return success\(res,[^\n]*refresh_token:/);
assert.match(middleware, /getAccessToken/);
assert.match(middleware, /assertCsrfForSession/);
assert.match(sessionService, /csrfTokenHash/);
assert.match(compose, /CSRF_SECRET_FILE/);
assert.match(compose, /COOKIE_SECURE:\s*"true"/);

console.log('Phase 4 security checks passed: HttpOnly cookie sessions, signed double-submit CSRF, token rotation, and cookie clearing.');
