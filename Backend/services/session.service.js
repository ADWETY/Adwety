const crypto = require('crypto');
const { Session, User } = require('../models');
const env = require('../config/env');
const { signAccessToken } = require('./token.service');
const { AppError } = require('../utils/helpers');
const { csrfHash, assertCsrfForSession } = require('./http-session.service');

function refreshHash(token) {
  return crypto.createHmac('sha256', env.refreshTokenSecret).update(String(token || '')).digest('hex');
}
function requestMeta(req) {
  return {
    ip: String(req?.ip || '').slice(0, 100),
    userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 500)
  };
}
function sessionPayload(user, session, rawRefresh, rawCsrf) {
  const accessToken = signAccessToken(user, session, { mfaVerifiedAt: session.mfaVerifiedAt });
  return {
    token: accessToken,
    access_token: accessToken,
    refresh_token: rawRefresh,
    token_type: 'Bearer',
    expires_in: env.accessTokenMinutes * 60,
    refresh_expires_in: env.refreshTokenDays * 24 * 60 * 60,
    csrf_token: rawCsrf
  };
}

async function createSessionTokens(user, req, { familyId = crypto.randomUUID(), mfaVerifiedAt = null } = {}) {
  const rawRefresh = crypto.randomBytes(64).toString('base64url');
  const rawCsrf = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const meta = requestMeta(req);
  const session = await Session.create({
    userId: user._id,
    refreshTokenHash: refreshHash(rawRefresh),
    csrfTokenHash: csrfHash(rawCsrf),
    familyId,
    tokenVersion: Number(user.tokenVersion || 0),
    mfaVerifiedAt: mfaVerifiedAt || null,
    ...meta,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + env.refreshTokenDays * 86400000)
  });
  return { session, ...sessionPayload(user, session, rawRefresh, rawCsrf) };
}

async function rotateRefreshToken(rawToken, req, { requireCsrf = false } = {}) {
  if (!rawToken) throw new AppError('Refresh token is required', 401);
  const tokenHash = refreshHash(rawToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash }).select('+refreshTokenHash +csrfTokenHash');
  if (!session) throw new AppError('Invalid refresh token', 401);
  if (requireCsrf) assertCsrfForSession(req, session, { force: true });
  const now = new Date();
  if (session.revokedAt) {
    await Session.updateMany({ familyId: session.familyId, revokedAt: null }, { $set: { revokedAt: now, revokeReason: 'refresh_token_reuse' } });
    await User.updateOne({ _id: session.userId }, { $inc: { tokenVersion: 1 } });
    throw new AppError('Refresh token reuse detected; all sessions were revoked', 401);
  }
  if (session.expiresAt <= now) throw new AppError('Refresh token expired', 401);
  const user = await User.findById(session.userId);
  if (!user || user.isActive === false || Number(user.tokenVersion || 0) !== Number(session.tokenVersion || 0)) {
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: now, revokeReason: 'invalid_user_or_version' } });
    throw new AppError('Invalid refresh token', 401);
  }

  // Atomically claim the refresh token. A second concurrent/replayed use fails this update.
  const claimed = await Session.findOneAndUpdate(
    { _id: session._id, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, revokeReason: 'rotating', lastUsedAt: now } },
    { new: true }
  );
  if (!claimed) {
    await Session.updateMany({ familyId: session.familyId, revokedAt: null }, { $set: { revokedAt: now, revokeReason: 'refresh_token_reuse' } });
    await User.updateOne({ _id: session.userId }, { $inc: { tokenVersion: 1 } });
    throw new AppError('Refresh token reuse detected; all sessions were revoked', 401);
  }

  try {
    const next = await createSessionTokens(user, req, { familyId: session.familyId, mfaVerifiedAt: session.mfaVerifiedAt });
    await Session.updateOne({ _id: session._id }, { $set: { revokeReason: 'rotated', replacedBySessionId: next.session._id } });
    return { user, ...next };
  } catch (error) {
    await Session.updateMany({ familyId: session.familyId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: 'rotation_failed' } });
    throw error;
  }
}

async function revokeSession(sessionId, reason = 'logout') {
  if (!sessionId) return;
  await Session.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: reason } });
}
async function revokeByRefreshToken(rawToken, reason = 'logout') {
  if (!rawToken) return;
  await Session.updateOne({ refreshTokenHash: refreshHash(rawToken), revokedAt: null }, { $set: { revokedAt: new Date(), revokeReason: reason } });
}
async function invalidateUserSessions(userId, reason = 'security_change', { incrementVersion = true } = {}) {
  const now = new Date();
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: now, revokeReason: reason } });
  if (incrementVersion) await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}
async function updateSessionMfa(sessionId, at = new Date()) {
  const session = await Session.findByIdAndUpdate(sessionId, { $set: { mfaVerifiedAt: at, lastUsedAt: new Date() } }, { new: true });
  if (!session || session.revokedAt) throw new AppError('Session is no longer valid', 401);
  return session;
}

module.exports = {
  createSessionTokens,
  rotateRefreshToken,
  revokeSession,
  revokeByRefreshToken,
  invalidateUserSessions,
  updateSessionMfa,
  refreshHash
};
