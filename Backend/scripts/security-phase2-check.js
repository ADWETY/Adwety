'use strict';
process.env.NODE_ENV = 'test';
process.env.PASSWORD_BREACH_CHECK = 'off';
process.env.JWT_SECRET = 'j'.repeat(64);
process.env.OTP_HASH_SECRET = 'o'.repeat(64);
process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(64);
process.env.CSRF_SECRET = 'c'.repeat(64);
process.env.PASSWORD_PEPPER = 'p'.repeat(64);
process.env.DATA_ENCRYPTION_KEY = 'd'.repeat(64);
process.env.MFA_ENCRYPTION_KEY = 'm'.repeat(64);

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { hashPassword, verifyPassword, assertStrongPassword } = require('../services/password.service');
const { encryptJson, decryptJson } = require('../services/data-protection.service');
const { currentTotp, verifyTotp } = require('../services/mfa.service');
const { detectType } = require('../services/file-security.service');

function source(name) { return fs.readFileSync(path.join(__dirname, '..', name), 'utf8'); }

(async () => {
  const userModel = source('models/user.model.js');
  const sessionModel = source('models/session.model.js');
  const tokenService = source('services/token.service.js');
  const authMiddleware = source('middleware/auth.js');
  const sessionService = source('services/session.service.js');
  const authRoutes = source('routes/auth.routes.js');
  const adminRoutes = source('routes/admin.routes.js');
  const redisService = source('services/redis.service.js');
  const securityMiddleware = source('middleware/security.js');
  const aiModel = source('models/ai-log.model.js');
  const loggingService = source('services/logging.service.js');
  const uploadService = source('services/file-security.service.js');
  const compose = source('docker-compose.yml');

  assert.match(userModel, /tokenVersion/);
  assert.match(userModel, /mfaEnabled/);
  assert.match(sessionModel, /refreshTokenHash/);
  assert.match(sessionModel, /expireAfterSeconds:\s*0/);
  assert.match(tokenService, /sid:/);
  assert.match(tokenService, /ver:/);
  assert.match(tokenService, /accessTokenMinutes/);
  assert.match(authMiddleware, /Session\.findById/);
  assert.match(authMiddleware, /tokenVersion/);
  assert.match(sessionService, /refresh_token_reuse/);
  assert.match(sessionService, /findOneAndUpdate/);
  assert.match(authRoutes, /\/refresh/);
  assert.match(authRoutes, /\/logout-all/);

  assert.match(userModel, /mfaSecretEncrypted/);
  assert.match(userModel, /mfaRecoveryCodeHashes/);
  assert.match(authRoutes, /mfa\/setup\/verify/);
  assert.match(authRoutes, /mfa\/reauth/);
  assert.match(adminRoutes, /requireRecentMfaForWrites/);
  assert.match(adminRoutes, /getSensitiveAiLog/);

  assert.match(redisService, /require\('redis'\)/);
  assert.match(redisService, /EVAL|eval\(/i);
  assert.match(securityMiddleware, /Retry-After/);
  assert.match(compose, /adwety-redis/);
  assert.match(compose, /REDIS_REQUIRED:\s*"true"/);

  await assert.rejects(() => assertStrongPassword('Short123!'), /12/);
  await assert.rejects(() => assertStrongPassword('Password123!'), /common|predictable/i);
  const longPassword = 'A-very-long-and-unique-password-for-Adwety-2026!';
  const hash = await hashPassword(longPassword, { email: 'user@example.com', fullName: 'Different Name' });
  assert.match(hash, /^v2\$/);
  assert.equal(await verifyPassword(longPassword, hash), true);
  assert.equal(await verifyPassword(`${longPassword}x`, hash), false);

  const encrypted = encryptJson({ medical: 'sensitive' });
  assert.notEqual(encrypted.includes('sensitive'), true);
  assert.deepEqual(decryptJson(encrypted), { medical: 'sensitive' });
  assert.match(aiModel, /sensitivePayloadEncrypted/);
  assert.match(aiModel, /expireAfterSeconds:\s*0/);
  assert.match(loggingService, /consentToStore/);
  assert.doesNotMatch(loggingService, /extractedText:\s*extractedText/);

  const secret = 'JBSWY3DPEHPK3PXP';
  const now = 1710000000000;
  const code = currentTotp(secret, now);
  assert.equal(verifyTotp(secret, code, { now, window: 0 }), true);
  assert.equal(verifyTotp(secret, '000000', { now, window: 0 }), code === '000000');

  assert.equal(detectType(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])), 'image/png');
  assert.equal(detectType(Buffer.from('%PDF-1.7\nxxxxxxx')), 'application/pdf');
  assert.equal(detectType(Buffer.from('not-a-real-file')), null);
  assert.match(uploadService, /clamScan/);
  assert.match(uploadService, /sharp\(/);
  assert.match(uploadService, /\/JavaScript/);
  assert.match(compose, /adwety-clamav/);
  assert.match(compose, /CLAMAV_REQUIRED:\s*"true"/);

  console.log('Phase 2 security checks passed: sessions, MFA, Redis limiting, passwords, AI privacy, and upload hardening.');
})().catch((error) => { console.error(error); process.exit(1); });
