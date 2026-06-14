const crypto = require('crypto');
const env = require('../config/env');

function keyFrom(value) {
  const raw = String(value || '');
  if (/^[a-fA-F0-9]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch (_) {}
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptJson(value, secret = env.dataEncryptionKey) {
  const key = keyFrom(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptJson(payload, secret = env.dataEncryptionKey) {
  const [version, ivRaw, tagRaw, dataRaw] = String(payload || '').split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !dataRaw) throw new Error('Invalid encrypted payload');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFrom(secret), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataRaw, 'base64url')), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

function redactText(value) {
  return String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[REDACTED_PHONE]')
    .replace(/\b\d{10,16}\b/g, '[REDACTED_ID]')
    .replace(/\b(?:name|patient|المريض|الاسم)\s*[:：-]\s*[^\n,;]{2,80}/gi, '$1: [REDACTED_NAME]')
    .slice(0, 500);
}

module.exports = { encryptJson, decryptJson, redactText };
