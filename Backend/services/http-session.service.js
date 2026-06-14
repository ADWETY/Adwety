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

function cookieOptions({ httpOnly, maxAge, path = env.cookiePath }) {
  return {
    httpOnly,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path,
    maxAge
  };
}

function clearCookieAtPath(res, name, { httpOnly, path, domain = '' }) {
  res.clearCookie(name, {
    httpOnly,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path,
    ...(domain ? { domain } : {})
  });
}

function setAccessCookie(res, accessToken) {
  res.cookie(env.accessCookieName, accessToken, cookieOptions({
    httpOnly: true,
    maxAge: env.accessTokenMinutes * 60 * 1000
  }));
}

function setCsrfCookie(res, csrfToken) {
  // Remove the legacy /api/v1-scoped CSRF cookie before setting the new root
  // cookie. This prevents duplicate cookies with the same name from producing
  // intermittent token mismatches in different browsers.
  if (env.csrfCookiePath !== env.cookiePath) {
    clearCookieAtPath(res, env.csrfCookieName, {
      httpOnly: false,
      path: env.cookiePath,
      domain: env.csrfCookieDomain
    });
  }

  res.cookie(env.csrfCookieName, csrfToken, {
    ...cookieOptions({
      httpOnly: false,
      maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
      path: env.csrfCookiePath
    }),
    ...(env.csrfCookieDomain ? { domain: env.csrfCookieDomain } : {})
  });
}

function setSessionCookies(res, tokens) {
  setAccessCookie(res, tokens.access_token || tokens.token);
  res.cookie(env.refreshCookieName, tokens.refresh_token, cookieOptions({
    httpOnly: true,
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000
  }));
  setCsrfCookie(res, tokens.csrf_token);
}

function clearSessionCookies(res) {
  clearCookieAtPath(res, env.accessCookieName, { httpOnly: true, path: env.cookiePath });
  clearCookieAtPath(res, env.refreshCookieName, { httpOnly: true, path: env.cookiePath });
  clearCookieAtPath(res, env.csrfCookieName, {
    httpOnly: false,
    path: env.csrfCookiePath,
    domain: env.csrfCookieDomain
  });
  if (env.csrfCookiePath !== env.cookiePath) {
    clearCookieAtPath(res, env.csrfCookieName, {
      httpOnly: false,
      path: env.cookiePath,
      domain: env.csrfCookieDomain
    });
  }
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
  setCsrfCookie,
  setSessionCookies,
  clearSessionCookies
};
