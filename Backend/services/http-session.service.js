'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function parseCookies(header = '') {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (!key) continue;
    const raw = part.slice(index + 1).trim();
    try { cookies[key] = decodeURIComponent(raw); }
    catch (_error) { cookies[key] = raw; }
  }
  return cookies;
}

function cookiesFrom(req) {
  if (!req._adwetyCookies) req._adwetyCookies = parseCookies(req.headers?.cookie || '');
  return req._adwetyCookies;
}

function readCookie(req, name) {
  return cookiesFrom(req)[name] || '';
}

function getAccessToken(req) {
  return readCookie(req, env.accessCookieName);
}

function getRefreshToken(req) {
  return readCookie(req, env.refreshCookieName);
}

function getCsrfCookie(req) {
  return readCookie(req, env.csrfCookieName);
}

function getCsrfHeader(req) {
  return String(req.headers?.['x-csrf-token'] || '').trim();
}

function csrfHash(token) {
  return crypto.createHmac('sha256', env.csrfSecret).update(String(token || '')).digest('hex');
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function assertCsrfForSession(req, session, { force = false } = {}) {
  if (!force && !UNSAFE_METHODS.has(String(req.method || 'GET').toUpperCase())) return;
  const cookie = getCsrfCookie(req);
  const header = getCsrfHeader(req);
  if (!cookie || !header || !safeEqualText(cookie, header)) {
    throw new AppError('Invalid CSRF token', 403, { code: 'CSRF_INVALID' });
  }
  const expected = session?.csrfTokenHash;
  const actual = csrfHash(header);
  if (!expected || !safeEqualText(expected, actual)) {
    throw new AppError('Invalid CSRF token', 403, { code: 'CSRF_INVALID' });
  }
}

function baseCookieOptions({ httpOnly, maxAge }) {
  return {
    httpOnly,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: env.cookiePath,
    maxAge
  };
}

function setAccessCookie(res, accessToken) {
  res.cookie(env.accessCookieName, accessToken, baseCookieOptions({
    httpOnly: true,
    maxAge: env.accessTokenMinutes * 60 * 1000
  }));
}

function setSessionCookies(res, tokens) {
  setAccessCookie(res, tokens.access_token || tokens.token);
  res.cookie(env.refreshCookieName, tokens.refresh_token, baseCookieOptions({
    httpOnly: true,
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000
  }));
  res.cookie(env.csrfCookieName, tokens.csrf_token, {
    ...baseCookieOptions({
      httpOnly: false,
      maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000
    }),
    ...(env.csrfCookieDomain ? { domain: env.csrfCookieDomain } : {})
  });
}

function clearSessionCookies(res) {
  const common = {
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: env.cookiePath
  };
  res.clearCookie(env.accessCookieName, { ...common, httpOnly: true });
  res.clearCookie(env.refreshCookieName, { ...common, httpOnly: true });
  res.clearCookie(env.csrfCookieName, { ...common, httpOnly: false, ...(env.csrfCookieDomain ? { domain: env.csrfCookieDomain } : {}) });
}

module.exports = {
  parseCookies,
  readCookie,
  getAccessToken,
  getRefreshToken,
  getCsrfCookie,
  getCsrfHeader,
  csrfHash,
  assertCsrfForSession,
  setAccessCookie,
  setSessionCookies,
  clearSessionCookies
};
