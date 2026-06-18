const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { adminRequiresMfa, isLegacyAdminMfaExempt, policyVersion } = require('./mfa-policy.service');

function signAccessToken(user, session, { mfaVerifiedAt = null } = {}) {
  const mfaAt = mfaVerifiedAt || session?.mfaVerifiedAt || null;
  const requiresMfa = adminRequiresMfa(user);
  return jwt.sign({
    sub: user._id.toString(),
    role: user.role,
    sid: session._id.toString(),
    ver: Number(user.tokenVersion || 0),
    mfa: !requiresMfa || user.mfaEnabled === true,
    mfa_exempt: isLegacyAdminMfaExempt(user),
    mfa_policy_version: policyVersion(user),
    mfa_at: mfaAt ? Math.floor(new Date(mfaAt).getTime() / 1000) : null,
    jti: crypto.randomUUID()
  }, env.jwtSecret, {
    expiresIn: `${env.accessTokenMinutes}m`,
    issuer: 'adwety-backend',
    audience: 'adwety-client'
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer: 'adwety-backend', audience: 'adwety-client' });
}

module.exports = { signAccessToken, verifyToken };
