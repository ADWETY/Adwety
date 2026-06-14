'use strict';

const { rateLimit } = require('./security');

function normalizedEmail(req) {
  return String(req.body?.email || '').trim().toLowerCase() || 'missing-email';
}

// Shared prefixes deliberately make all aliases consume the same Redis bucket.
// An attacker cannot multiply the allowed attempts by switching between /api,
// /api/v1, /v1, or compatibility endpoints.
const registrationIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  prefix: 'auth-register-ip',
  keyGenerator: (req) => req.ip
});
const registrationAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  prefix: 'auth-register-account',
  keyGenerator: (req) => normalizedEmail(req)
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  delayAfter: 2,
  delayMs: 350,
  prefix: 'auth-login-pair',
  keyGenerator: (req) => `${req.ip}:${normalizedEmail(req)}`
});
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: 'auth-mfa-challenge',
  keyGenerator: (req) => `${req.ip}:${String(req.body?.challengeId || req.body?.challenge_id || req.body?.otp_token || '')}`
});
const forgotPairLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 4,
  delayAfter: 1,
  delayMs: 500,
  prefix: 'auth-forgot-pair',
  keyGenerator: (req) => `${req.ip}:${normalizedEmail(req)}`
});
const forgotAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  delayAfter: 2,
  delayMs: 500,
  prefix: 'auth-forgot-account',
  keyGenerator: (req) => normalizedEmail(req)
});
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  delayAfter: 2,
  delayMs: 500,
  prefix: 'auth-otp-request',
  keyGenerator: (req) => `${req.ip}:${String(req.body?.requestId || req.body?.request_id || req.body?.otp_token || req.body?.challengeId || req.body?.challenge_id || '')}`
});
const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  prefix: 'auth-refresh',
  keyGenerator: (req) => `${req.ip}:${String(req.body?.refresh_token || req.body?.refreshToken || '').slice(0, 16)}`
});

module.exports = {
  registrationLimiters: [registrationIpLimiter, registrationAccountLimiter],
  registrationIpLimiter,
  registrationAccountLimiter,
  loginLimiter,
  mfaLimiter,
  refreshLimiter,
  forgotPairLimiter,
  forgotAccountLimiter,
  otpRequestLimiter
};
