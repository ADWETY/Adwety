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
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError('CORS blocked: origin is not allowed', 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  };
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests' } = {}) {
  const hits = new Map();
  return (req, _res, next) => {
    const now = Date.now();
    const key = `${req.ip || req.socket.remoteAddress}:${req.originalUrl.split('?')[0]}`;
    const record = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (record.resetAt <= now) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    hits.set(key, record);

    if (record.count > max) {
      return next(new AppError(message, 429));
    }
    return next();
  };
}

const apiLimiter = createRateLimiter({ max: 300, windowMs: 15 * 60 * 1000 });
const authLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many login attempts. Please try again later.' });
const uploadLimiter = createRateLimiter({ max: 30, windowMs: 15 * 60 * 1000, message: 'Too many upload requests. Please try again later.' });

module.exports = {
  sanitizeRequest,
  corsOptions,
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
};
