const crypto = require('crypto');
const RateLimit = require('../../DB/Models/ratelimit.model');
const env = require('../config/env');
const { AppError } = require('../utils/error-handling');
const { sanitizeRequestObject, sanitizeEmail } = require('../utils/security');

const unsafeCookieKeys = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') sanitizeRequestObject(req.body);
  if (req.query && typeof req.query === 'object') sanitizeRequestObject(req.query);
  if (req.params && typeof req.params === 'object') sanitizeRequestObject(req.params);
  next();
}

function corsOptions() {
  return {
    origin(origin, callback) {
      if (!origin) {
        if (env.allowNoOriginRequests) return callback(null, true);
        return callback(new AppError('CORS blocked: missing Origin header', 403));
      }
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError('CORS blocked: origin is not allowed', 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
  };
}

function parseCookies(req, _res, next) {
  const header = req.headers.cookie || '';
  req.cookies = Object.create(null);
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key || unsafeCookieKeys.has(key)) return;
    try { req.cookies[key] = decodeURIComponent(value); } catch (_) { req.cookies[key] = value; }
  });
  next();
}

function makeCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function setAuthCookies(res, token) {
  const csrfToken = makeCsrfToken();
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
  res.cookie(env.csrfCookieName, csrfToken, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
  return csrfToken;
}

function clearAuthCookies(res) {
  const options = { secure: env.cookieSecure, sameSite: env.cookieSameSite, path: '/' };
  res.clearCookie(env.authCookieName, options);
  res.clearCookie(env.csrfCookieName, options);
}

function safeTokenEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue || ''), 'utf8');
  const right = Buffer.from(String(rightValue || ''), 'utf8');
  if (!left.length || !right.length) return false;
  const key = crypto.randomBytes(32);
  const leftDigest = crypto.createHmac('sha256', key).update(left).digest();
  const rightDigest = crypto.createHmac('sha256', key).update(right).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function csrfProtection(req, _res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const hasCookieAuth = Boolean(req.cookies?.[env.authCookieName]);
  const hasBearerAuth = Boolean((req.headers.authorization || '').startsWith('Bearer '));
  if (!hasCookieAuth && !hasBearerAuth) return next();

  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.headers['x-csrf-token'];
  if (!safeTokenEqual(cookieToken, headerToken)) {
    return next(new AppError('CSRF token validation failed', 403));
  }
  return next();
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function getRateLimitKey(req) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${ip}:${req.originalUrl.split('?')[0]}`.slice(0, 500);
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests', keyGenerator = null } = {}) {
  return async (req, _res, next) => {
    try {
      const now = new Date();
      const resetAt = new Date(Date.now() + windowMs);
      const key = String(keyGenerator ? keyGenerator(req) : getRateLimitKey(req)).slice(0, 500);

      await RateLimit.deleteMany({ resetAt: { $lte: now } }).catch(() => {});
      const record = await RateLimit.findOneAndUpdate(
        { key, resetAt: { $gt: now } },
        { $inc: { count: 1 }, $setOnInsert: { key, resetAt, createdAt: now }, $set: { updatedAt: now } },
        { new: true, upsert: true }
      ).lean();

      if (record.count > max) return next(new AppError(message, 429));
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function createEmailRateLimiter({ windowMs = 60 * 60 * 1000, max = 5, message = 'Too many OTP requests for this email. Please try again later.' } = {}) {
  return async (req, _res, next) => {
    try {
      const email = sanitizeEmail(req.body?.email || '');
      if (!email) return next();
      const now = new Date();
      const resetAt = new Date(Date.now() + windowMs);
      const key = `email:${hashValue(email)}:${req.originalUrl.split('?')[0]}`.slice(0, 500);

      await RateLimit.deleteMany({ resetAt: { $lte: now } }).catch(() => {});
      const record = await RateLimit.findOneAndUpdate(
        { key, resetAt: { $gt: now } },
        { $inc: { count: 1 }, $setOnInsert: { key, resetAt, createdAt: now }, $set: { updatedAt: now } },
        { new: true, upsert: true }
      ).lean();

      if (record.count > max) return next(new AppError(message, 429));
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const apiLimiter = createRateLimiter({ max: 300, windowMs: 15 * 60 * 1000 });
const authLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many login attempts. Please try again later.' });
const uploadLimiter = createRateLimiter({ max: 30, windowMs: 15 * 60 * 1000, message: 'Too many upload requests. Please try again later.' });
const otpEmailLimiter = createEmailRateLimiter({ max: 3, windowMs: 60 * 60 * 1000 });
const authEmailLimiter = createEmailRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many attempts for this account. Please try again later.' });
const scanUserLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Prescription scan limit exceeded. Please try again later.',
  keyGenerator: (req) => `scan:${req.authUser?._id || req.ip || 'anonymous'}`,
});

module.exports = {
  sanitizeRequest,
  corsOptions,
  parseCookies,
  csrfProtection,
  setAuthCookies,
  clearAuthCookies,
  createRateLimiter,
  createEmailRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  otpEmailLimiter,
  authEmailLimiter,
  scanUserLimiter,
};
