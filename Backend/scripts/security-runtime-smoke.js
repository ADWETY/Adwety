'use strict';
process.env.NODE_ENV = 'test';
process.env.REDIS_REQUIRED = 'false';
process.env.CLAMAV_REQUIRED = 'false';
process.env.PASSWORD_BREACH_CHECK = 'off';
process.env.JWT_SECRET = 'j'.repeat(64);
process.env.OTP_HASH_SECRET = 'o'.repeat(64);
process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(64);
process.env.CSRF_SECRET = 'c'.repeat(64);
process.env.PASSWORD_PEPPER = 'p'.repeat(64);
process.env.DATA_ENCRYPTION_KEY = 'd'.repeat(64);
process.env.MFA_ENCRYPTION_KEY = 'm'.repeat(64);

const assert = require('node:assert/strict');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const { hashPassword, verifyPassword, assertStrongPassword } = require('../services/password.service');
const { encryptJson, decryptJson } = require('../services/data-protection.service');
const { currentTotp, verifyTotp } = require('../services/mfa.service');
const { inspectAndNormalize } = require('../services/file-security.service');

(async () => {
  await assert.rejects(() => assertStrongPassword('Password123!'), /common|predictable/i);
  const password = 'Unique-Adwety-security-passphrase-2026!';
  const hash = await hashPassword(password, { email: 'different@example.com', fullName: 'Different User' });
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword(`${password}x`, hash), false);

  // RFC 6238 SHA-1 vector, truncated to the six digits used by authenticator apps.
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(currentTotp(rfcSecret, 59_000), '287082');
  assert.equal(verifyTotp(rfcSecret, '287082', { now: 59_000, window: 0 }), true);

  const protectedPayload = encryptJson({ medical: 'sensitive' });
  assert.equal(protectedPayload.includes('sensitive'), false);
  assert.deepEqual(decryptJson(protectedPayload), { medical: 'sensitive' });

  const png = await sharp({
    create: { width: 20, height: 20, channels: 3, background: { r: 255, g: 255, b: 255 } }
  }).png().toBuffer();
  const imageFile = { buffer: png, mimetype: 'application/octet-stream', originalname: 'forged.exe' };
  await inspectAndNormalize(imageFile);
  assert.equal(imageFile.mimetype, 'image/png');
  assert.equal(imageFile.securityMetadata.width, 20);
  assert.equal(imageFile.originalname, 'upload');

  const document = await PDFDocument.create();
  document.addPage([200, 200]);
  const pdfFile = { buffer: Buffer.from(await document.save()), mimetype: 'text/plain', originalname: 'forged.txt' };
  await inspectAndNormalize(pdfFile);
  assert.equal(pdfFile.mimetype, 'application/pdf');
  assert.equal(pdfFile.securityMetadata.pages, 1);

  await assert.rejects(
    () => inspectAndNormalize({ buffer: Buffer.from('not a real file'), mimetype: 'image/png', originalname: 'fake.png' }),
    /Unsupported|forged/
  );

  for (const route of ['../routes', '../routes/flutter.routes', '../routes/legacy-dashboard.routes', '../routes/admin.routes']) require(route);
  console.log('Runtime security smoke tests passed: password policy, RFC TOTP, encryption, upload inspection, and route loading.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
