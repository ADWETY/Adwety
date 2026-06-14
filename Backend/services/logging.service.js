const { SystemLog, AiLog } = require('../models');
const env = require('../config/env');
const { encryptJson } = require('./data-protection.service');

async function systemLog(entry = {}) {
  if (!entry.action) return null;
  return SystemLog.create({ type: 'system', success: true, ...entry }).catch(() => null);
}
async function aiLog(entry = {}) {
  const consent = entry.consentToStore === true || (entry.consentToStore === undefined && env.aiStoreSensitiveByDefault);
  const extractedText = String(entry.extractedText || '');
  const extractedDrugs = Array.isArray(entry.extractedDrugs) ? entry.extractedDrugs.map(String) : [];
  const payload = {
    userId: entry.userId || null,
    redactedPreview: extractedText ? `[REDACTED_MEDICAL_TEXT:${extractedText.length}_CHARS]` : '',
    drugCount: extractedDrugs.length,
    consentToStore: consent,
    sensitivePayloadEncrypted: consent ? encryptJson({ extractedText, extractedDrugs }) : '',
    hasSensitivePayload: consent,
    confidence: entry.confidence || 0,
    status: entry.status || 'completed',
    errorMessage: String(entry.errorMessage || '').slice(0, 1000),
    provider: entry.provider || 'gemini',
    expiresAt: new Date(Date.now() + env.aiLogRetentionDays * 86400000)
  };
  return AiLog.create(payload).catch(() => null);
}
module.exports = { systemLog, aiLog };
