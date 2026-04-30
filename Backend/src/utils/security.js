function sanitizeEmail(email = '') {
  let cleanEmail = String(email).trim().toLowerCase();
  const [localPart = '', domain = ''] = cleanEmail.split('@');

  if (!localPart || !domain) return cleanEmail;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalizedLocal = localPart.split('+')[0].replace(/\./g, '');
    cleanEmail = `${normalizedLocal}@gmail.com`;
  }

  return cleanEmail;
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isNativeSafeObject(value) {
  return value instanceof Date
    || value instanceof RegExp
    || (typeof Buffer !== 'undefined' && Buffer.isBuffer(value));
}

function isDangerousKey(key) {
  return key === '__proto__'
    || key === 'prototype'
    || key === 'constructor'
    || key.startsWith('$')
    || key.includes('.');
}

function cleanObject(value, depth = 0) {
  if (depth > 20) return null;
  if (!value || typeof value !== 'object') return value;
  if (isNativeSafeObject(value)) return value;
  if (Array.isArray(value)) return value.map((item) => cleanObject(item, depth + 1));

  const clean = Object.create(null);
  for (const key of Object.keys(value)) {
    if (isDangerousKey(key)) continue;
    clean[key] = cleanObject(value[key], depth + 1);
  }
  return clean;
}

function sanitizeRequestObject(target) {
  if (!target || typeof target !== 'object' || isNativeSafeObject(target)) return;
  const clean = cleanObject(target);
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, clean || {});
}

module.exports = {
  sanitizeEmail,
  escapeRegex,
  cleanObject,
  sanitizeRequestObject,
};
