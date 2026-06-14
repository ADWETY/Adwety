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

function trustProxyValue(value, { production = false, required = false } = {}) {
  const raw = clean(value, 'false').toLowerCase();
  if (raw === 'true') {
    if (production) throw new Error('TRUST_PROXY=true is unsafe in production; set the exact trusted proxy hop count.');
    return 1;
  }
  if (['false', '0', 'off', 'no'].includes(raw)) {
    if (production && required) throw new Error('TRUST_PROXY must be the exact positive proxy hop count in production.');
    return false;
  }
  if (!/^[1-9]\d?$/.test(raw)) {
    throw new Error('TRUST_PROXY must be false or an exact hop count from 1 to 99.');
  }
  return Number(raw);
}

function readFileValue(filePath) {
  const target = clean(filePath);
  if (!target) return '';
  try { return fs.readFileSync(target, 'utf8').trim(); }
  catch (error) { throw new Error(`Unable to read secret file: ${target}`); }
}
function secret(name, fallback = '') {
  return clean(readFileValue(process.env[`${name}_FILE`]) || process.env[name], fallback);
}

const nodeEnv = clean(process.env.NODE_ENV, 'development');
const trustProxyRequired = bool(process.env.TRUST_PROXY_REQUIRED, nodeEnv === 'production');
const parsedTrustProxy = trustProxyValue(process.env.TRUST_PROXY, { production: nodeEnv === 'production', required: trustProxyRequired });
const providedSecret = secret('JWT_SECRET');
const otpHashSecret = secret('OTP_HASH_SECRET', nodeEnv === 'production' ? '' : (providedSecret || crypto.randomBytes(64).toString('hex')));
const refreshTokenSecret = secret('REFRESH_TOKEN_SECRET', nodeEnv === 'production' ? '' : (providedSecret || crypto.randomBytes(64).toString('hex')));
const csrfSecret = secret('CSRF_SECRET', nodeEnv === 'production' ? '' : (providedSecret || crypto.randomBytes(64).toString('hex')));
const passwordPepper = secret('PASSWORD_PEPPER', nodeEnv === 'production' ? '' : (providedSecret || crypto.randomBytes(64).toString('hex')));
const dataEncryptionKey = secret('DATA_ENCRYPTION_KEY', nodeEnv === 'production' ? '' : crypto.randomBytes(32).toString('hex'));
const mfaEncryptionKey = secret('MFA_ENCRYPTION_KEY', nodeEnv === 'production' ? '' : dataEncryptionKey);

if (nodeEnv === 'production' && providedSecret.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters in production.');
}
if (nodeEnv === 'production' && otpHashSecret.length < 64) {
  throw new Error('OTP_HASH_SECRET must be at least 64 characters in production.');
}
for (const [name, value] of Object.entries({ REFRESH_TOKEN_SECRET: refreshTokenSecret, CSRF_SECRET: csrfSecret, PASSWORD_PEPPER: passwordPepper, DATA_ENCRYPTION_KEY: dataEncryptionKey, MFA_ENCRYPTION_KEY: mfaEncryptionKey })) {
  if (nodeEnv === 'production' && value.length < 64) throw new Error(`${name} must be at least 64 characters in production.`);
}

const mongoUser = secret('MONGO_APP_USERNAME');
const mongoPassword = secret('MONGO_APP_PASSWORD');
const mongoHost = clean(process.env.MONGO_HOST, 'mongo');
const mongoPort = number(process.env.MONGO_PORT, 27017, 1, 65535);
const mongoDatabase = clean(process.env.MONGO_DATABASE, 'adwety');
const configuredMongoUri = secret('MONGODB_URI') || secret('MONGO_URI') || secret('DATABASE_URL');
const constructedMongoUri = mongoUser && mongoPassword
  ? `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}:${mongoPort}/${encodeURIComponent(mongoDatabase)}?authSource=${encodeURIComponent(mongoDatabase)}`
  : '';

module.exports = {
  nodeEnv,
  port: number(process.env.PORT || process.env.BACKEND_PORT, 6500, 1, 65535),
  mongoUri: configuredMongoUri || constructedMongoUri || 'mongodb://127.0.0.1:27017/adwety_dev',
  jwtSecret: providedSecret || crypto.randomBytes(64).toString('hex'),
  jwtExpiresIn: clean(process.env.JWT_EXPIRES_IN, '15m'),
  accessTokenMinutes: number(process.env.ACCESS_TOKEN_MINUTES, 15, 5, 30),
  refreshTokenDays: number(process.env.REFRESH_TOKEN_DAYS, 30, 1, 90),
  refreshTokenSecret,
  csrfSecret,
  accessCookieName: clean(process.env.ACCESS_COOKIE_NAME, 'adwety_access'),
  refreshCookieName: clean(process.env.REFRESH_COOKIE_NAME, 'adwety_refresh'),
  csrfCookieName: clean(process.env.CSRF_COOKIE_NAME, 'adwety_csrf'),
  csrfCookieDomain: clean(process.env.CSRF_COOKIE_DOMAIN),
  // The CSRF cookie must be readable by the SPA on routes such as /categories.
  // Access/refresh cookies remain scoped to /api/v1, but the non-HttpOnly CSRF
  // cookie uses / so document.cookie can read it from every dashboard page.
  csrfCookiePath: clean(process.env.CSRF_COOKIE_PATH, '/'),
  cookieSecure: bool(process.env.COOKIE_SECURE, nodeEnv === 'production'),
  cookieSameSite: clean(process.env.COOKIE_SAME_SITE, 'strict').toLowerCase(),
  cookiePath: clean(process.env.COOKIE_PATH, '/api/v1'),
  passwordPepper,
  passwordBreachCheck: clean(process.env.PASSWORD_BREACH_CHECK, nodeEnv === 'production' ? 'required' : 'optional').toLowerCase(),
  passwordBreachTimeoutMs: number(process.env.PASSWORD_BREACH_TIMEOUT_MS, 4000, 1000, 15000),
  dataEncryptionKey,
  mfaEncryptionKey,
  mfaIssuer: clean(process.env.MFA_ISSUER, 'Adwety Care'),
  mfaChallengeMinutes: number(process.env.MFA_CHALLENGE_MINUTES, 10, 3, 20),
  mfaMaxAttempts: number(process.env.MFA_MAX_ATTEMPTS, 5, 3, 10),
  mfaReauthMinutes: number(process.env.MFA_REAUTH_MINUTES, 10, 2, 30),
  otpHashSecret,
  otpTtlMinutes: number(process.env.OTP_TTL_MINUTES, 10, 3, 30),
  otpMaxAttempts: number(process.env.OTP_MAX_ATTEMPTS, 5, 3, 10),
  otpDevConsole: bool(process.env.OTP_DEV_CONSOLE, false),
  bcryptSaltRounds: number(process.env.BCRYPT_SALT_ROUNDS, 12, 10, 14),
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:6501', 'http://127.0.0.1:6501']),
  allowNoOriginRequests: bool(process.env.CORS_ALLOW_NO_ORIGIN, nodeEnv !== 'production'),
  trustProxy: parsedTrustProxy,
  trustProxyRequired,
  canonicalApiBase: '/api/v1',
  enableApiAlias: bool(process.env.ENABLE_API_ALIAS, false),
  enableMobileV1Alias: bool(process.env.ENABLE_MOBILE_V1_ALIAS, false),
  enableLegacyDashboardRoutes: bool(process.env.ENABLE_LEGACY_DASHBOARD_ROUTES, false),
  enableDashboardAlias: bool(process.env.ENABLE_DASHBOARD_ALIAS, false),
  apiSunsetAt: clean(process.env.API_SUNSET_AT, '2026-12-31T23:59:59Z'),
  uploadDir: clean(process.env.UPLOAD_DIR, 'private_uploads'),
  maxFileSizeMb: number(process.env.MAX_FILE_SIZE_MB, 5, 1, 20),
  geminiApiKey: secret('GEMINI_API_KEY'),
  geminiModel: clean(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
  geminiBaseUrl: clean(process.env.GEMINI_BASE_URL, 'https://generativelanguage.googleapis.com/v1beta'),
  aiTimeoutMs: number(process.env.AI_TIMEOUT_MS, 30000, 1000, 60000),
  aiRateLimitMax: number(process.env.AI_RATE_LIMIT_MAX, 10, 1, 60),
  aiRateLimitWindowMs: number(process.env.AI_RATE_LIMIT_WINDOW_MS, 60000, 10000, 3600000),
  aiDailyQuota: number(process.env.AI_DAILY_QUOTA, 50, 1, 10000),
  aiCircuitFailureThreshold: number(process.env.AI_CIRCUIT_FAILURE_THRESHOLD, 5, 2, 20),
  aiCircuitOpenMs: number(process.env.AI_CIRCUIT_OPEN_MS, 60000, 5000, 900000),
  aiLogRetentionDays: number(process.env.AI_LOG_RETENTION_DAYS, 30, 1, 365),
  aiStoreSensitiveByDefault: bool(process.env.AI_STORE_SENSITIVE_BY_DEFAULT, false),
  maxImagePixels: number(process.env.MAX_IMAGE_PIXELS, 20000000, 1000000, 100000000),
  maxPdfPages: number(process.env.MAX_PDF_PAGES, 10, 1, 100),
  clamavHost: clean(process.env.CLAMAV_HOST, 'clamav'),
  clamavPort: number(process.env.CLAMAV_PORT, 3310, 1, 65535),
  clamavTimeoutMs: number(process.env.CLAMAV_TIMEOUT_MS, 15000, 1000, 60000),
  clamavRequired: bool(process.env.CLAMAV_REQUIRED, nodeEnv === 'production'),
  redisUrl: secret('REDIS_URL'),
  redisPassword: secret('REDIS_PASSWORD'),
  redisRequired: bool(process.env.REDIS_REQUIRED, nodeEnv === 'production'),
  rateLimitPrefix: clean(process.env.RATE_LIMIT_PREFIX, 'adwety:rl'),
  apiRateLimitWindowMs: number(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000, 60 * 1000, 60 * 60 * 1000),
  apiRateLimitReadMax: number(process.env.API_RATE_LIMIT_READ_MAX, 5000, 300, 50000),
  apiRateLimitWriteMax: number(process.env.API_RATE_LIMIT_WRITE_MAX, 1000, 100, 10000),
  smtpHost: clean(process.env.SMTP_HOST),
  smtpPort: number(process.env.SMTP_PORT, 587, 1, 65535),
  smtpSecure: bool(process.env.SMTP_SECURE, false),
  smtpUser: clean(process.env.SMTP_USER),
  smtpPass: secret('SMTP_PASS'),
  smtpFrom: clean(process.env.SMTP_FROM),
  smtpTimeoutMs: number(process.env.SMTP_TIMEOUT_MS, 10000, 1000, 60000),
  smtpRejectUnauthorized: bool(process.env.SMTP_REJECT_UNAUTHORIZED, true),
  allowAdminRegister: bool(process.env.ALLOW_ADMIN_REGISTER, nodeEnv !== 'production')
};
