const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

function ensureUploadDir() {
  const fullPath = path.resolve(process.cwd(), env.uploadDir);
  fs.mkdirSync(fullPath, { recursive: true, mode: 0o700 });
  return fullPath;
}

function safeExtension(originalName = 'upload.bin') {
  const ext = path.extname(originalName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '.bin';
}

function saveBuffer(buffer, originalName = 'upload.bin') {
  const uploadDir = ensureUploadDir();
  const fileName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${safeExtension(originalName)}`;
  const fullPath = path.join(uploadDir, fileName);
  fs.writeFileSync(fullPath, buffer, { mode: 0o600 });
  return `private://${fileName}`;
}

module.exports = { saveBuffer };
