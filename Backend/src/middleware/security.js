const crypto = require('crypto');
const RateLimit = require('../../DB/Models/ratelimit.model');
const env = require('../config/env');
const { AppError } = require('../utils/error-handling');
const { sanitizeRequestObject } = require('../utils/security');

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
        if (env.allowNoOriginRequests || env.nodeEnv !== 'production') return callback(null, true);
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
  req.cookies = {};
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) return;
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

function csrfProtection(req, _res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.cookies?.[env.authCookieName]) return next();

  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('CSRF token validation failed', 403));
  }
  return next();
}

function getRateLimitKey(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return `${ip}:${req.originalUrl.split('?')[0]}`.slice(0, 500);
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests' } = {}) {
  return async (req, _res, next) => {
    try {
      const now = new Date();
      const resetAt = new Date(Date.now() + windowMs);
      const key = getRateLimitKey(req);

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

module.exports = {
  sanitizeRequest,
  corsOptions,
  parseCookies,
  csrfProtection,
  setAuthCookies,
  clearAuthCookies,
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
};
