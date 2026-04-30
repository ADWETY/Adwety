function sanitizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanObject(value, depth = 0) {
  if (depth > 20) return null;
  if (Array.isArray(value)) return value.map((item) => cleanObject(item, depth + 1));
  if (!value || typeof value !== 'object') return value;

  const clean = {};
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;
    clean[key] = cleanObject(item, depth + 1);
  }
  return clean;
}

function sanitizeRequestObject(target) {
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
