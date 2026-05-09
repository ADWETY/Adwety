const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: env.maxFileSizeMb * 1024 * 1024 }, fileFilter(_req, file, cb) { const ext = path.extname(file.originalname || '').toLowerCase(); if (!allowed.has(file.mimetype) || !['.jpg','.jpeg','.png','.webp','.pdf'].includes(ext)) return cb(new AppError('Invalid upload type', 415)); return cb(null, true); } });
module.exports = upload;
