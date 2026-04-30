const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env') });

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseOrigins(value) {
  const defaults = ['http://localhost:6501', 'http://127.0.0.1:6501'];
  const raw = value || process.env.FRONTEND_BASE_URL || defaults.join(',');
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function isWeakSecret(secret) {
  return !secret || secret.length < 64 || ['change-me', 'replace_with_a_long_random_secret', 'secret', 'jwt_secret'].includes(secret);
}

const providedJwtSecret = process.env.JWT_SECRET || '';
const runtimeJwtSecret = providedJwtSecret || crypto.randomBytes(64).toString('hex');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.BACKEND_PORT || process.env.PORT || 6500),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adwety_dev',
  backendBaseUrl: process.env.BACKEND_BASE_URL || 'http://localhost:6500',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:6501',
  frontendPublicUrl: process.env.FRONTEND_PUBLIC_URL || 'http://127.0.0.1:6501',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  allowNoOriginRequests: parseBoolean(process.env.CORS_ALLOW_NO_ORIGIN, false),
  jwtSecret: runtimeJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  authCookieName: process.env.AUTH_COOKIE_NAME || 'adwety_auth',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'adwety_csrf',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, (process.env.NODE_ENV || 'development') === 'production'),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'strict',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  uploadDir: process.env.UPLOAD_DIR || 'private_uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 30000),
  aiFallbackEnabled: parseBoolean(process.env.AI_FALLBACK_ENABLED, true),
  enableDemoAuth: parseBoolean(process.env.ENABLE_DEMO_AUTH, false),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  customAiApiUrl: process.env.CUSTOM_AI_API_URL || '',
  customAiApiKey: process.env.CUSTOM_AI_API_KEY || '',
  customAiModel: process.env.CUSTOM_AI_MODEL || '',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@adwety.local',

  requireRegisterOtp: parseBoolean(process.env.REQUIRE_REGISTER_OTP, true),
  requireLoginOtp: parseBoolean(process.env.REQUIRE_LOGIN_OTP, false),
  requirePasswordResetOtp: parseBoolean(process.env.REQUIRE_PASSWORD_RESET_OTP, true),
  otpLength: Number(process.env.OTP_LENGTH || 6),
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpDeliveryChannel: process.env.OTP_DELIVERY_CHANNEL || 'email',
  smsProvider: process.env.SMS_PROVIDER || 'console',
  smsFrom: process.env.SMS_FROM || 'ADWETY',

  seedForceReset: parseBoolean(process.env.SEED_FORCE_RESET, false),
  seedOwnerEmail: process.env.SEED_OWNER_EMAIL || '',
  seedOwnerPassword: process.env.SEED_OWNER_PASSWORD || '',
  seedSuperAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || '',
  seedSuperAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || '',
  seedPharmacyAdminEmail: process.env.SEED_PHARMACY_ADMIN_EMAIL || '',
  seedPharmacyAdminPassword: process.env.SEED_PHARMACY_ADMIN_PASSWORD || '',
  seedSupportAdminEmail: process.env.SEED_SUPPORT_ADMIN_EMAIL || '',
  seedSupportAdminPassword: process.env.SEED_SUPPORT_ADMIN_PASSWORD || '',
  seedDemoUserEmail: process.env.SEED_DEMO_USER_EMAIL || '',
  seedDemoUserPassword: process.env.SEED_DEMO_USER_PASSWORD || '',
};

if (!providedJwtSecret) {
  console.warn('[SECURITY WARNING] JWT_SECRET is not set. A random runtime secret was generated. Set JWT_SECRET in .env for stable sessions.');
}

if (isWeakSecret(env.jwtSecret)) {
  if (env.nodeEnv === 'production') {
    throw new Error('Security error: JWT_SECRET must be at least 64 characters and not a placeholder in production.');
  }
  console.warn('[SECURITY WARNING] JWT_SECRET is shorter than recommended. Generate one with: openssl rand -hex 64');
}

if (env.nodeEnv === 'production' && env.enableDemoAuth) {
  throw new Error('Security error: ENABLE_DEMO_AUTH must be false in production.');
}

module.exports = env;
