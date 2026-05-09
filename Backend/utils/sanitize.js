function isDangerousKey(key) { return key === '__proto__' || key === 'constructor' || key === 'prototype' || key.startsWith('$') || key.includes('.'); }
function cleanObject(value, depth = 0) {
  if (depth > 20 || !value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map((item) => cleanObject(item, depth + 1));
  const out = {};
  Object.keys(value).forEach((key) => { if (!isDangerousKey(key)) out[key] = cleanObject(value[key], depth + 1); });
  return out;
}
function sanitizeTarget(target) { if (!target || typeof target !== 'object') return; const clean = cleanObject(target); Object.keys(target).forEach((key) => delete target[key]); Object.assign(target, clean); }
module.exports = { sanitizeTarget };
