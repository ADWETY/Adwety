const { AppError } = require('../utils/helpers');
const { sanitizeTarget } = require('../utils/sanitize');
const env = require('../config/env');
function sanitizeRequest(req, _res, next) { sanitizeTarget(req.body); sanitizeTarget(req.query); sanitizeTarget(req.params); next(); }
function corsOptions() { return { origin(origin, cb) { if (!origin && env.allowNoOriginRequests) return cb(null, true); if (origin && env.corsOrigins.includes(origin)) return cb(null, true); return cb(new AppError('CORS blocked: origin is not allowed', 403)); }, credentials: true }; }
function rateLimit({ windowMs = 60000, max = 120 } = {}) { const hits = new Map(); return (req, _res, next) => { const now = Date.now(); const key = `${req.ip}:${req.method}:${req.path}`; const row = hits.get(key) || { count: 0, resetAt: now + windowMs }; if (row.resetAt <= now) { row.count = 0; row.resetAt = now + windowMs; } row.count += 1; hits.set(key, row); if (row.count > max) return next(new AppError('Too many requests', 429)); return next(); }; }
module.exports = { sanitizeRequest, corsOptions, rateLimit };
