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
process.env.COOKIE_PATH = '/api/v1';
process.env.CSRF_COOKIE_PATH = '/';

const env = require('../config/env');
const {
  csrfHash,
  assertCsrfForSession,
  setSessionCookies,
  clearSessionCookies,
} = require('../services/http-session.service');

test('CSRF cookie is readable from all SPA routes while auth cookies stay API-scoped', () => {
  const calls = [];
  const res = {
    cookie: (...args) => calls.push(['cookie', ...args]),
    clearCookie: (...args) => calls.push(['clear', ...args]),
  };

  setSessionCookies(res, {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    csrf_token: 'csrf-token',
  });

  const accessSet = calls.find((row) => row[0] === 'cookie' && row[1] === env.accessCookieName);
  const refreshSet = calls.find((row) => row[0] === 'cookie' && row[1] === env.refreshCookieName);
  const csrfSet = calls.find((row) => row[0] === 'cookie' && row[1] === env.csrfCookieName);

  assert.equal(accessSet[3].path, '/api/v1');
  assert.equal(refreshSet[3].path, '/api/v1');
  assert.equal(csrfSet[3].path, '/');
  assert.equal(csrfSet[3].httpOnly, false);
  assert.ok(calls.some((row) => row[0] === 'clear' && row[1] === env.csrfCookieName && row[2].path === '/api/v1'));
});

test('matching cookie/header token passes and mismatched tokens are rejected', () => {
  const session = { csrfTokenHash: csrfHash('csrf-token') };
  const validRequest = {
    method: 'POST',
    headers: {
      cookie: 'adwety_csrf=csrf-token',
      'x-csrf-token': 'csrf-token',
    },
  };
  assert.doesNotThrow(() => assertCsrfForSession(validRequest, session));

  const invalidRequest = {
    method: 'POST',
    headers: {
      cookie: 'adwety_csrf=csrf-token',
      'x-csrf-token': 'wrong-token',
    },
  };
  assert.throws(() => assertCsrfForSession(invalidRequest, session), /Invalid CSRF token/);
});

test('logout clears both new and legacy CSRF cookie paths', () => {
  const calls = [];
  const res = { clearCookie: (...args) => calls.push(args) };
  clearSessionCookies(res);
  assert.ok(calls.some((row) => row[0] === env.csrfCookieName && row[1].path === '/'));
  assert.ok(calls.some((row) => row[0] === env.csrfCookieName && row[1].path === '/api/v1'));
});
