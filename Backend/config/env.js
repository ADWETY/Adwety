const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

function clean(value, fallback = '') {
  const result = String(value ?? '').trim();
  return result || fallback;
}
function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}
function number(value, fallback, min, max) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, n));
}
function list(value, fallback = []) {
  return String(value || fallback.join(',')).split(',').map((item) => item.trim()).filter(Boolean);
}
const nodeEnv = clean(process.env.NODE_ENV, 'development');
const providedSecret = clean(process.env.JWT_SECRET);
if (nodeEnv === 'production' && providedSecret.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters in production.');
}

module.exports = {
  nodeEnv,
  port: number(process.env.PORT || process.env.BACKEND_PORT, 6500, 1, 65535),
  mongoUri: clean(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/adwety_dev'),
  jwtSecret: providedSecret || crypto.randomBytes(64).toString('hex'),
  jwtExpiresIn: clean(process.env.JWT_EXPIRES_IN, '2h'),
  bcryptSaltRounds: number(process.env.BCRYPT_SALT_ROUNDS, 12, 10, 14),
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:6501', 'http://127.0.0.1:6501']),
  allowNoOriginRequests: bool(process.env.CORS_ALLOW_NO_ORIGIN, nodeEnv !== 'production'),
  trustProxy: clean(process.env.TRUST_PROXY, 'false'),
  uploadDir: clean(process.env.UPLOAD_DIR, 'private_uploads'),
  maxFileSizeMb: number(process.env.MAX_FILE_SIZE_MB, 5, 1, 20),
  geminiApiKey: clean(process.env.GEMINI_API_KEY),
  geminiModel: clean(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
  geminiBaseUrl: clean(process.env.GEMINI_BASE_URL, 'https://generativelanguage.googleapis.com/v1beta'),
  aiTimeoutMs: number(process.env.AI_TIMEOUT_MS, 30000, 1000, 60000),
  allowAdminRegister: bool(process.env.ALLOW_ADMIN_REGISTER, nodeEnv !== 'production')
};
