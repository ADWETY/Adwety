const connectDatabase = require('../config/database');
const env = require('../config/env');
const { AiLog } = require('../models');

async function run() {
  await connectDatabase();
  const cursor = AiLog.find({}).select('+extractedText +extractedDrugs').cursor();
  let processed = 0;
  let changed = 0;
  for await (const log of cursor) {
    processed += 1;
    const text = String(log.extractedText || '');
    const drugs = Array.isArray(log.extractedDrugs) ? log.extractedDrugs : [];
    const expiresAt = log.expiresAt || new Date(new Date(log.createdAt || Date.now()).getTime() + env.aiLogRetentionDays * 86400000);
    const set = { expiresAt };
    if (!log.redactedPreview && text) set.redactedPreview = `[REDACTED_MEDICAL_TEXT:${text.length}_CHARS]`;
    if (!log.drugCount && drugs.length) set.drugCount = drugs.length;
    if (log.sensitivePayloadEncrypted) set.hasSensitivePayload = true;
    const update = { $set: set, $unset: { extractedText: 1, extractedDrugs: 1 } };
    await AiLog.updateOne({ _id: log._id }, update);
    changed += 1;
  }
  console.log(JSON.stringify({ processed, changed, retentionDays: env.aiLogRetentionDays }));
  process.exit(0);
}
run().catch((error) => { console.error(error); process.exit(1); });
