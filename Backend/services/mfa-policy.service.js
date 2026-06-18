'use strict';

function policyVersion(user) {
  return Number(user?.mfaPolicyVersion || 1);
}

function adminRequiresMfa(_user) {
  // Dashboard MFA is disabled. Admin and pharmacist users authenticate with
  // email/password only, then receive a normal session token immediately.
  return false;
}

function isLegacyAdminMfaExempt(user) {
  return Boolean(user?.role === 'admin');
}

module.exports = {
  policyVersion,
  adminRequiresMfa,
  isLegacyAdminMfaExempt
};
