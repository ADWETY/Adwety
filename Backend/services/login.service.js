const { User } = require('../models');
const { AppError } = require('../utils/helpers');
const { verifyPassword, maybeUpgradePasswordHash } = require('./password.service');
const { createSessionTokens } = require('./session.service');
const { isLegacyAdminMfaExempt } = require('./mfa-policy.service');
const abuse = require('./auth-abuse.service');

async function beginLogin(email, password, req, options = {}) {
  const normalized = String(email || '').trim().toLowerCase();
  const locked = await abuse.lockRemaining(normalized, req.ip);
  if (locked) {
    req.res?.setHeader('Retry-After', String(locked));
    throw new AppError('Invalid email or password', 401);
  }

  const user = await User.findOne({ email: normalized }).select('+passwordHash');
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok || user.isActive === false) {
    const failure = await abuse.recordFailure(normalized, req.ip);
    if (failure.lockSeconds) req.res?.setHeader('Retry-After', String(failure.lockSeconds));
    throw new AppError('Invalid email or password', 401);
  }

  const allowedRoles = Array.isArray(options.allowedRoles) ? options.allowedRoles : null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AppError('Web dashboard access is limited to administrators and pharmacists', 403, { code: 'WEB_ACCESS_DENIED' });
  }

  await abuse.clearFailures(normalized, req.ip);

  const legacyHash = !String(user.passwordHash || '').startsWith('v2$');
  let passwordUpgradeRecommended = Number(user.passwordPolicyVersion || 1) < 2;

  // Existing accounts remain usable. A legacy password that already satisfies
  // the current policy is upgraded transparently; otherwise login succeeds and
  // the UI receives a non-blocking recommendation to change it.
  if (legacyHash) {
    const upgraded = await maybeUpgradePasswordHash(password, user.passwordHash, { email: user.email, fullName: user.fullName });
    if (upgraded) {
      user.passwordHash = upgraded;
      user.passwordPolicyVersion = 2;
      passwordUpgradeRecommended = false;
    } else {
      user.passwordPolicyVersion = 1;
      passwordUpgradeRecommended = true;
    }
  } else if (Number(user.passwordPolicyVersion || 1) < 2) {
    user.passwordPolicyVersion = 2;
    passwordUpgradeRecommended = false;
  }

  user.lastLoginAt = new Date();
  await user.save();

  // MFA / Authenticator login challenge is intentionally disabled for the
  // dashboard. Successful email/password authentication creates the session
  // immediately instead of returning mfa_required / mfa_setup_required.
  return {
    user,
    passwordUpgradeRecommended,
    mfaGrandfathered: isLegacyAdminMfaExempt(user),
    tokens: await createSessionTokens(user, req)
  };
}

module.exports = { beginLogin };
