const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const { AppError } = require('../utils/error-handling');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

function fileFilter(_req, file, callback) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
    return callback(new AppError('Invalid upload type. Only JPG, PNG, WEBP and PDF are allowed.', 415));
  }
  return callback(null, true);
}

function detectMimeFromMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.slice(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function validateUploadedFileContent(file) {
  if (!file?.buffer) return;
  const detected = detectMimeFromMagicBytes(file.buffer);
  if (!detected || !allowedMimeTypes.has(detected)) {
    throw new AppError('File content does not match an allowed image/PDF type.', 415);
  }
  if (detected !== file.mimetype) {
    throw new AppError('MIME type mismatch detected.', 415);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
});

upload.validateUploadedFileContent = validateUploadedFileContent;
module.exports = upload;
