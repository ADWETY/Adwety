const { User, Session } = require('../models');
const { verifyToken } = require('../services/token.service');
const { AppError } = require('../utils/helpers');
const env = require('../config/env');
const { getAccessToken, assertCsrfForSession } = require('../services/http-session.service');
const { adminRequiresMfa } = require('../services/mfa-policy.service');

async function resolveAuthentication(req) {
  const header = req.headers.authorization || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const cookieToken = getAccessToken(req);
  const token = bearerToken || cookieToken;
  if (!token) throw new AppError('Unauthorized', 401);

  const payload = verifyToken(token);
  if (!payload.sid || payload.ver === undefined) throw new AppError('Unauthorized', 401);

  const userQuery = User.findById(payload.sub);
  const sessionQuery = Session.findById(payload.sid);
  const [user, session] = await Promise.all([
    userQuery,
    typeof sessionQuery?.select === 'function' ? sessionQuery.select('+csrfTokenHash') : sessionQuery
  ]);
  if (!user || user.isActive === false || !session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError('Unauthorized', 401);
  }
  if (
    String(session.userId) !== String(user._id)
    || Number(payload.ver) !== Number(user.tokenVersion || 0)
    || Number(session.tokenVersion) !== Number(user.tokenVersion || 0)
  ) throw new AppError('Unauthorized', 401);

  if (user.passwordChangedAt && payload.iat) {
    const changed = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
    if (changed > Number(payload.iat)) throw new AppError('Unauthorized', 401);
  }

  const viaCookie = !bearerToken && Boolean(cookieToken);
  if (viaCookie) assertCsrfForSession(req, session);

  req.authUser = user;
  req.authRole = user.role;
  req.authTokenPayload = payload;
  req.authSession = session;
  req.authViaCookie = viaCookie;
}

async function auth(req, _res, next) {
  try { await resolveAuthentication(req); return next(); }
  catch (error) {
    if (error?.statusCode === 403) return next(error);
    return next(new AppError('Unauthorized', 401));
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ') && !getAccessToken(req)) return next();
  return auth(req, res, next);
}

// Logout must still be able to revoke a supplied refresh token when the access token has expired.
async function optionalLenient(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ') && !getAccessToken(req)) return next();
  try { await resolveAuthentication(req); }
  catch (error) {
    if (error?.statusCode === 403) return next(error);
    // Intentionally continue on expired/invalid access tokens so the refresh cookie can be revoked.
  }
  return next();
}

function normalizeRole(role) {
  return ({ owner: 'admin', super_admin: 'admin', support_admin: 'admin', pharmacy_admin: 'pharmacist', user: 'patient' })[role] || role;
}
function authorize(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const normalizedAllowed = allowed.map(normalizeRole);
  return (req, _res, next) => {
    const actual = req.authRole;
    const normalized = normalizeRole(actual);
    if (!actual || (!allowed.includes(actual) && !normalizedAllowed.includes(normalized))) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    return next();
  };
}
function requireRecentMfa(req, _res, next) {
  if (req.authRole !== 'admin') return next();
  // Legacy administrators are intentionally grandfathered. New administrators
  // (MFA policy v2) and anyone who already enabled MFA remain protected.
  if (!adminRequiresMfa(req.authUser)) return next();
  if (!req.authUser.mfaEnabled) return next(new AppError('Administrator MFA enrollment is required', 403));
  const at = Number(req.authTokenPayload?.mfa_at || 0);
  const age = Date.now() / 1000 - at;
  if (!at || age > env.mfaReauthMinutes * 60) {
    return next(new AppError('Recent MFA re-authentication is required', 403, { code: 'MFA_REAUTH_REQUIRED' }));
  }
  return next();
}
function requireRecentMfaForWrites(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return requireRecentMfa(req, res, next);
  return next();
}

auth.optional = optionalAuth;
auth.optionalLenient = optionalLenient;
auth.authorize = authorize;
auth.normalizeRole = normalizeRole;
auth.requireRecentMfa = requireRecentMfa;
auth.requireRecentMfaForWrites = requireRecentMfaForWrites;
module.exports = auth;
