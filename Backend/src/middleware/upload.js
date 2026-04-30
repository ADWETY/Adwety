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

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
});
