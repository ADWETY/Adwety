const { SystemLog, AiLog } = require('../models');
async function systemLog(entry = {}) {
  if (!entry.action) return null;
  return SystemLog.create({ type: 'system', success: true, ...entry }).catch(() => null);
}
async function aiLog(entry = {}) {
  return AiLog.create(entry).catch(() => null);
}
module.exports = { systemLog, aiLog };
