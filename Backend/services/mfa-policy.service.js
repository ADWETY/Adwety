'use strict';

function policyVersion(user) {
  return Number(user?.mfaPolicyVersion || 1);
}

function adminRequiresMfa(user) {
  if (!user || user.role !== 'admin') return false;
  // Existing administrators are grandfathered when the field is absent or set
  // to version 1. Administrators created or promoted after this rollout use
  // version 2 and must complete MFA enrollment and verification.
  return user.mfaEnabled === true || policyVersion(user) >= 2;
}

function isLegacyAdminMfaExempt(user) {
  return Boolean(user?.role === 'admin' && !adminRequiresMfa(user));
}

module.exports = {
  policyVersion,
  adminRequiresMfa,
  isLegacyAdminMfaExempt
};
