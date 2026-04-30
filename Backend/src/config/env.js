const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

function loadEnvFiles() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  const loaded = new Set();
  candidates.forEach((filePath) => {
    if (!loaded.has(filePath) && fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
      loaded.add(filePath);
    }
  });
}

loadEnvFiles();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOrigins(value) {
  const defaults = ['http://localhost:6501', 'http://127.0.0.1:6501'];
  const raw = value || process.env.FRONTEND_BASE_URL || defaults.join(',');
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function clean(value, fallback = '') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function isWeakSecret(secret) {
  return !secret || secret.length < 64 || ['change-me', 'replace_with_a_long_random_secret', 'secret', 'jwt_secret'].includes(secret);
}

const nodeEnv = clean(process.env.NODE_ENV, 'development');
const providedJwtSecret = clean(process.env.JWT_SECRET);

if (!providedJwtSecret && nodeEnv === 'production') {
  throw new Error('Security error: JWT_SECRET must be set in production. Generate one with: openssl rand -hex 64');
}

const runtimeJwtSecret = providedJwtSecret || crypto.randomBytes(64).toString('hex');

const env = {
  nodeEnv,
  port: parseNumber(process.env.BACKEND_PORT || process.env.PORT, 6500),
  mongoUri: clean(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/adwety_dev'),
  backendBaseUrl: clean(process.env.BACKEND_BASE_URL, 'http://localhost:6500'),
  frontendBaseUrl: clean(process.env.FRONTEND_BASE_URL, 'http://localhost:6501'),
  frontendPublicUrl: clean(process.env.FRONTEND_PUBLIC_URL, 'http://127.0.0.1:6501'),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  allowNoOriginRequests: parseBoolean(process.env.CORS_ALLOW_NO_ORIGIN, false),
  jwtSecret: runtimeJwtSecret,
  jwtExpiresIn: clean(process.env.JWT_EXPIRES_IN, '2h'),
  authCookieName: clean(process.env.AUTH_COOKIE_NAME, 'adwety_auth'),
  csrfCookieName: clean(process.env.CSRF_COOKIE_NAME, 'adwety_csrf'),
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, nodeEnv === 'production'),
  cookieSameSite: clean(process.env.COOKIE_SAME_SITE, 'strict'),
  bcryptSaltRounds: parseNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  uploadDir: clean(process.env.UPLOAD_DIR, 'private_uploads'),
  maxFileSizeMb: parseNumber(process.env.MAX_FILE_SIZE_MB, 5),
  aiProvider: clean(process.env.AI_PROVIDER, 'gemini').toLowerCase(),
  aiTimeoutMs: parseNumber(process.env.AI_TIMEOUT_MS, 30000),
  aiFallbackEnabled: parseBoolean(process.env.AI_FALLBACK_ENABLED, true),
  enableDemoAuth: parseBoolean(process.env.ENABLE_DEMO_AUTH, false),
  geminiApiKey: clean(process.env.GEMINI_API_KEY),
  geminiModel: clean(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
  geminiBaseUrl: clean(process.env.GEMINI_BASE_URL, 'https://generativelanguage.googleapis.com/v1beta'),
  customAiApiUrl: clean(process.env.CUSTOM_AI_API_URL),
  customAiApiKey: clean(process.env.CUSTOM_AI_API_KEY),
  customAiModel: clean(process.env.CUSTOM_AI_MODEL),
  mailDriver: clean(process.env.MAIL_DRIVER, 'smtp').toLowerCase(),
  mailFromName: clean(process.env.MAIL_FROM_NAME, 'ADWETY'),
  mailFromEmail: clean(process.env.MAIL_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER, 'no-reply@adwety.local'),
  emailFrom: clean(process.env.MAIL_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER, 'no-reply@adwety.local'),
  smtpHost: clean(process.env.SMTP_HOST, 'smtp.gmail.com'),
  smtpPort: parseNumber(process.env.SMTP_PORT, 465),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, String(process.env.SMTP_PORT || '465') === '465'),
  smtpUser: clean(process.env.SMTP_USER),
  smtpPass: clean(process.env.SMTP_PASS).replace(/\s+/g, ''),
  smtpRejectUnauthorized: parseBoolean(process.env.SMTP_REJECT_UNAUTHORIZED, true),
  smtpConnectionTimeoutMs: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 20000),
  smtpGreetingTimeoutMs: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 20000),
  smtpSocketTimeoutMs: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 30000),
  showDevOtp: parseBoolean(process.env.SHOW_DEV_OTP, false),
  requireRegisterOtp: parseBoolean(process.env.REQUIRE_REGISTER_OTP, true),
  requireLoginOtp: parseBoolean(process.env.REQUIRE_LOGIN_OTP, false),
  requirePasswordResetOtp: parseBoolean(process.env.REQUIRE_PASSWORD_RESET_OTP, true),
  otpLength: parseNumber(process.env.OTP_LENGTH, 6),
  otpExpiresMinutes: parseNumber(process.env.OTP_EXPIRES_MINUTES, 10),
  otpMaxAttempts: parseNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  otpDeliveryChannel: clean(process.env.OTP_DELIVERY_CHANNEL, 'email').toLowerCase(),
  smsProvider: clean(process.env.SMS_PROVIDER, 'console'),
  smsFrom: clean(process.env.SMS_FROM, 'ADWETY'),
  seedForceReset: parseBoolean(process.env.SEED_FORCE_RESET, false),
  allowProductionSeed: parseBoolean(process.env.ALLOW_PRODUCTION_SEED, false),
  seedOwnerEmail: clean(process.env.SEED_OWNER_EMAIL),
  seedOwnerPassword: clean(process.env.SEED_OWNER_PASSWORD),
  seedSuperAdminEmail: clean(process.env.SEED_SUPER_ADMIN_EMAIL),
  seedSuperAdminPassword: clean(process.env.SEED_SUPER_ADMIN_PASSWORD),
  seedPharmacyAdminEmail: clean(process.env.SEED_PHARMACY_ADMIN_EMAIL),
  seedPharmacyAdminPassword: clean(process.env.SEED_PHARMACY_ADMIN_PASSWORD),
  seedSupportAdminEmail: clean(process.env.SEED_SUPPORT_ADMIN_EMAIL),
  seedSupportAdminPassword: clean(process.env.SEED_SUPPORT_ADMIN_PASSWORD),
  seedDemoUserEmail: clean(process.env.SEED_DEMO_USER_EMAIL),
  seedDemoUserPassword: clean(process.env.SEED_DEMO_USER_PASSWORD),
};

if (!providedJwtSecret) {
  console.warn('[SECURITY WARNING] JWT_SECRET is not set. A random runtime secret was generated for development only. Set JWT_SECRET in Backend/.env for stable sessions.');
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

if (env.mailDriver === 'smtp' && env.smtpUser && env.mailFromEmail && env.smtpUser.toLowerCase() !== env.mailFromEmail.toLowerCase() && env.nodeEnv === 'production') {
  console.warn('[MAIL WARNING] MAIL_FROM_EMAIL is different from SMTP_USER. Use an authenticated domain or matching Gmail account to improve inbox delivery.');
}

module.exports = env;
