const crypto = require('crypto');
const { MfaChallenge } = require('../models');
const env = require('../config/env');
const { encryptJson, decryptJson } = require('./data-protection.service');
const { AppError } = require('../utils/helpers');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
function base32Decode(value) {
  const clean = String(value || '').toUpperCase().replace(/=|\s/g, '');
  let bits = '';
  for (const c of clean) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) throw new Error('Invalid base32');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function hotp(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const num = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(num).padStart(6, '0');
}
function currentTotp(secret, now = Date.now()) { return hotp(secret, Math.floor(now / 30000)); }
function verifyTotp(secret, code, { window = 1, now = Date.now() } = {}) {
  const normalized = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(now / 30000);
  for (let delta = -window; delta <= window; delta += 1) {
    const expected = hotp(secret, counter + delta);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) return true;
  }
  return false;
}
function challengeHash(id) { return crypto.createHmac('sha256', env.mfaEncryptionKey).update(id).digest('hex'); }
function recoveryHash(code) { return crypto.createHmac('sha256', env.mfaEncryptionKey).update(String(code).toUpperCase()).digest('hex'); }
function generateRecoveryCodes(count = 10) { return Array.from({ length: count }, () => `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`); }
function provisioningUri(user, secret) {
  const label = encodeURIComponent(`${env.mfaIssuer}:${user.email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(env.mfaIssuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function createChallenge(user, req, purpose) {
  const requestId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.mfaChallengeMinutes * 60000);
  let secret = null;
  let setupSecretEncrypted = '';
  if (purpose === 'setup') {
    secret = base32Encode(crypto.randomBytes(20));
    setupSecretEncrypted = encryptJson({ secret }, env.mfaEncryptionKey);
  }
  await MfaChallenge.create({
    userId: user._id,
    requestIdHash: challengeHash(requestId),
    purpose,
    setupSecretEncrypted,
    maxAttempts: env.mfaMaxAttempts,
    expiresAt,
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500)
  });
  return {
    challenge_id: requestId,
    expires_in: env.mfaChallengeMinutes * 60,
    ...(secret ? { setup_secret: secret, provisioning_uri: provisioningUri(user, secret) } : {})
  };
}

async function loadChallenge(requestId, purpose) {
  const row = await MfaChallenge.findOne({ requestIdHash: challengeHash(requestId), purpose }).select('+requestIdHash +setupSecretEncrypted');
  if (!row || row.consumedAt || row.expiresAt <= new Date()) throw new AppError('Invalid or expired MFA challenge', 401);
  if (row.attempts >= row.maxAttempts) throw new AppError('MFA challenge locked', 429);
  return row;
}

async function loadAnyChallenge(requestId) {
  const row = await MfaChallenge.findOne({ requestIdHash: challengeHash(requestId), purpose: { $in: ['login','setup'] } }).select('+requestIdHash +setupSecretEncrypted');
  if (!row || row.consumedAt || row.expiresAt <= new Date()) throw new AppError('Invalid or expired MFA challenge', 401);
  if (row.attempts >= row.maxAttempts) throw new AppError('MFA challenge locked', 429);
  return row;
}

async function failChallenge(row) {
  const nextAttempts = Number(row.attempts || 0) + 1;
  await MfaChallenge.updateOne(
    { _id: row._id, consumedAt: null },
    { $inc: { attempts: 1 }, ...(nextAttempts >= row.maxAttempts ? { $set: { consumedAt: new Date() } } : {}) }
  );
}
async function consumeChallenge(row) {
  const consumed = await MfaChallenge.findOneAndUpdate(
    { _id: row._id, consumedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: row.maxAttempts } },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );
  if (!consumed) throw new AppError('MFA challenge was already used or expired', 401);
  return consumed;
}

function decryptUserSecret(user) {
  if (!user.mfaSecretEncrypted) throw new AppError('MFA is not configured', 403);
  return decryptJson(user.mfaSecretEncrypted, env.mfaEncryptionKey).secret;
}
async function verifyUserMfa(user, code) {
  const normalized = String(code || '').trim().toUpperCase();
  const secret = decryptUserSecret(user);
  if (verifyTotp(secret, normalized)) return { ok: true, recoveryUsed: false };
  const hash = recoveryHash(normalized);
  const found = (user.mfaRecoveryCodeHashes || []).find((x) => {
    const a = Buffer.from(String(x)); const b = Buffer.from(hash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (found) {
    const result = await user.constructor.updateOne({ _id: user._id, mfaRecoveryCodeHashes: found }, { $pull: { mfaRecoveryCodeHashes: found } });
    if (result.modifiedCount === 1) return { ok: true, recoveryUsed: true };
  }
  return { ok: false, recoveryUsed: false };
}

module.exports = {
  createChallenge, loadChallenge, loadAnyChallenge, failChallenge, consumeChallenge,
  verifyTotp, currentTotp, verifyUserMfa, generateRecoveryCodes, recoveryHash,
  encryptMfaSecret: (secret) => encryptJson({ secret }, env.mfaEncryptionKey),
  decryptSetupSecret: (row) => decryptJson(row.setupSecretEncrypted, env.mfaEncryptionKey).secret
};
