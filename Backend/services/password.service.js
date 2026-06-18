const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');

const COMMON = new Set([
  'password','password1','password123','admin','admin123','qwerty','qwerty123','12345678','123456789',
  '1234567890','letmein','welcome','welcome123','iloveyou','abc123','user123','adwety123','passw0rd',
  'كلمةالمرور','١٢٣٤٥٦٧٨','123123123','00000000'
]);

function normalized(value) { return String(value || '').normalize('NFKC'); }
function prehash(password) { return crypto.createHmac('sha512', env.passwordPepper).update(normalized(password), 'utf8').digest('base64'); }

async function breachedCount(password) {
  const mode = env.passwordBreachCheck;
  if (mode === 'off') return 0;
  const digest = crypto.createHash('sha1').update(normalized(password), 'utf8').digest('hex').toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.passwordBreachTimeoutMs);
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'Adwety-Backend-Security' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HIBP ${response.status}`);
    const text = await response.text();
    for (const line of text.split(/\r?\n/)) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) return Number(count || 1);
    }
    return 0;
  } catch (error) {
    if (mode === 'required') throw new AppError('Password safety verification is temporarily unavailable', 503);
    return 0;
  } finally { clearTimeout(timer); }
}

async function assertStrongPassword(password, context = {}) {
  const p = normalized(password);
  if (p.length < 12 || p.length > 128) throw new AppError('Password must be between 12 and 128 characters', 422);
  if (/^\s|\s$/.test(p)) throw new AppError('Password cannot start or end with whitespace', 422);
  const lower = p.toLowerCase();
  const compact = lower.replace(/[^a-z0-9\u0600-\u06ff]/g, '');
  if (COMMON.has(lower) || COMMON.has(compact) || /^(.)\1{11,}$/.test(p) || /^(?:1234|abcd|qwer)/i.test(compact)) throw new AppError('Password is too common or predictable', 422);
  const personal = [context.email, context.fullName, context.name]
    .filter(Boolean).map((x) => String(x).toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, ''))
    .filter((x) => x.length >= 4);
  if (personal.some((x) => compact.includes(x))) throw new AppError('Password must not contain your name or email', 422);
  if (await breachedCount(p)) throw new AppError('This password has appeared in a known data breach; choose another password', 422);
  return p;
}

async function hashPassword(password, context = {}) {
  const p = await assertStrongPassword(password, context);
  return `v2$${await bcrypt.hash(prehash(p), env.bcryptSaltRounds)}`;
}

async function verifyPassword(password, storedHash) {
  const hash = String(storedHash || '');
  if (hash.startsWith('v2$')) return bcrypt.compare(prehash(password), hash.slice(3));
  return bcrypt.compare(String(password || ''), hash);
}

async function maybeUpgradePasswordHash(password, storedHash, context = {}) {
  if (String(storedHash || '').startsWith('v2$')) return null;
  try { return await hashPassword(password, context); }
  catch (error) { if (error?.statusCode === 503) throw error; return null; }
}

module.exports = { assertStrongPassword, hashPassword, verifyPassword, maybeUpgradePasswordHash };
