const env = require('../config/env');
const { Notification } = require('../models');
const { AppError } = require('../utils/helpers');
const { rateLimit } = require('./security');
const { increment } = require('../services/redis.service');

const aiRateLimiter = rateLimit({
  windowMs: env.aiRateLimitWindowMs,
  max: env.aiRateLimitMax,
  prefix: 'ai-minute',
  keyGenerator: (req) => `${req.authUser?._id || 'anonymous'}:${req.ip}`
});

async function maybeNotifyAdmins(req, used, threshold) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const existing = await Notification.findOne({
    audience: 'admin',
    'metadata.kind': 'ai_quota',
    'metadata.userId': String(req.authUser._id),
    'metadata.threshold': threshold,
    createdAt: { $gte: today }
  }).lean();
  if (existing) return;
  await Notification.create({
    type: 'system',
    title: threshold === 100 ? 'AI quota blocked' : 'AI quota warning',
    message: `User ${req.authUser.email} reached ${used}/${env.aiDailyQuota} prescription scans today.`,
    audience: 'admin', recipientUserId: null, createdBy: req.authUser._id,
    metadata: { kind: 'ai_quota', userId: String(req.authUser._id), used, limit: env.aiDailyQuota, threshold }
  }).catch(() => null);
}

async function aiDailyQuota(req, res, next) {
  try {
    if (!req.authUser) return next(new AppError('Unauthorized', 401));
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ttlMs = Math.max(60000, tomorrow.getTime() - now.getTime());
    const day = now.toISOString().slice(0, 10);
    const row = await increment(`adwety:ai:daily:${day}:${req.authUser._id}`, ttlMs);
    const used = row.count;
    res.setHeader('X-AI-Quota-Limit', String(env.aiDailyQuota));
    res.setHeader('X-AI-Quota-Remaining', String(Math.max(0, env.aiDailyQuota - used)));
    if (used > env.aiDailyQuota) {
      await maybeNotifyAdmins(req, used - 1, 100);
      const retryAfter = Math.max(60, Math.ceil(ttlMs / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return next(new AppError('Daily AI prescription scan quota exceeded', 429));
    }
    if (used === Math.ceil(env.aiDailyQuota * 0.8)) await maybeNotifyAdmins(req, used, 80);
    req.aiUsage = { used, limit: env.aiDailyQuota };
    return next();
  } catch (error) { return next(error); }
}
module.exports = { aiRateLimiter, aiDailyQuota };
