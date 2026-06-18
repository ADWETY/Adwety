const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { verifyPassword, maybeUpgradePasswordHash, hashPassword } = require('../services/password.service');
const { adminRequiresMfa, isLegacyAdminMfaExempt } = require('../services/mfa-policy.service');

(async () => {
  const loginSource = fs.readFileSync(path.join(__dirname, '../services/login.service.js'), 'utf8');
  const authSource = fs.readFileSync(path.join(__dirname, '../controllers/auth.controller.js'), 'utf8');
  const userModelSource = fs.readFileSync(path.join(__dirname, '../models/user.model.js'), 'utf8');
  const adminSource = fs.readFileSync(path.join(__dirname, '../controllers/admin.controller.js'), 'utf8');
  const authMiddlewareSource = fs.readFileSync(path.join(__dirname, '../middleware/auth.js'), 'utf8');

  assert.ok(!loginSource.includes('PASSWORD_UPGRADE_REQUIRED'), 'legacy login must not be blocked by the old forced-upgrade error');
  assert.ok(loginSource.includes('passwordUpgradeRecommended=true'), 'legacy weak passwords must return a recommendation');
  assert.ok(authSource.includes('passwordPolicyVersion:2'), 'new public registrations must use password policy version 2');

  const weakLegacyPassword = 'Admin123';
  const legacyHash = await bcrypt.hash(weakLegacyPassword, 4);
  assert.equal(await verifyPassword(weakLegacyPassword, legacyHash), true, 'legacy password must remain verifiable');
  assert.equal(await maybeUpgradePasswordHash(weakLegacyPassword, legacyHash, { email: 'legacy@example.com', fullName: 'Legacy User' }), null, 'weak legacy password must not be silently rewritten');

  const strongPassword = 'A-Long-Unique-Phrase-2026!';
  const strongLegacyHash = await bcrypt.hash(strongPassword, 4);
  const upgraded = await maybeUpgradePasswordHash(strongPassword, strongLegacyHash, { email: 'legacy@example.com', fullName: 'Legacy User' });
  assert.ok(String(upgraded).startsWith('v2$'), 'strong legacy password should upgrade transparently');
  assert.equal(await verifyPassword(strongPassword, upgraded), true, 'upgraded hash must verify');

  const newHash = await hashPassword('Another-Unique-Phrase-2026!', { email: 'new@example.com', fullName: 'New User' });
  assert.ok(newHash.startsWith('v2$'), 'new passwords must use policy v2 hashing');

  assert.match(userModelSource, /mfaPolicyVersion/);
  assert.match(adminSource, /mfaPolicyVersion\s*=\s*data\.role\s*===\s*'admin'\s*\?\s*2\s*:\s*1/);
  assert.match(authMiddlewareSource, /adminRequiresMfa\(req\.authUser\)/);

  const legacyAdmin = { role: 'admin', mfaEnabled: false, mfaPolicyVersion: 1 };
  const missingPolicyLegacyAdmin = { role: 'admin', mfaEnabled: false };
  const newAdmin = { role: 'admin', mfaEnabled: false, mfaPolicyVersion: 2 };
  const enrolledLegacyAdmin = { role: 'admin', mfaEnabled: true, mfaPolicyVersion: 1 };
  const patient = { role: 'patient', mfaEnabled: false, mfaPolicyVersion: 2 };

  assert.equal(adminRequiresMfa(legacyAdmin), false, 'legacy admin must enter without forced MFA');
  assert.equal(adminRequiresMfa(missingPolicyLegacyAdmin), false, 'existing admin documents without the new field must be grandfathered');
  assert.equal(isLegacyAdminMfaExempt(legacyAdmin), true);
  assert.equal(adminRequiresMfa(newAdmin), true, 'new admin must enroll in MFA');
  assert.equal(adminRequiresMfa(enrolledLegacyAdmin), true, 'an admin who already enabled MFA must keep using it');
  assert.equal(adminRequiresMfa(patient), false);

  console.log('Password and administrator MFA grandfathering checks: PASS');
})().catch((error) => { console.error(error); process.exit(1); });
