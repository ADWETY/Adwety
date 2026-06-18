const crypto = require('crypto');
const { OtpRequest } = require('../models');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const { sendOtpEmail, assertOtpDeliveryReady } = require('./email.service');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function maskEmail(email) {
  const value = normalizeEmail(email);
  const [local = '', domain = ''] = value.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateRequestId() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizeOtp(value) {
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const eastern = '۰۱۲۳۴۵۶۷۸۹';
  return String(value || '')
    .trim()
    .replace(/[٠-٩]/g, (char) => String(arabic.indexOf(char)))
    .replace(/[۰-۹]/g, (char) => String(eastern.indexOf(char)));
}

function hashOtp({ requestId, purpose, otp }) {
  return crypto
    .createHmac('sha256', env.otpHashSecret)
    .update(`${purpose}:${requestId}:${normalizeOtp(otp)}`)
    .digest('hex');
}

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ''), 'hex');
    const right = Buffer.from(String(b || ''), 'hex');
    return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch (_) {
    return false;
  }
}

async function createOtpRequest({ purpose, user, targetEmail = '', request }) {
  assertOtpDeliveryReady();
  const requestId = generateRequestId();
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);
  const accountEmail = normalizeEmail(user.email);
  const destination = purpose === 'change_email' ? normalizeEmail(targetEmail) : accountEmail;

  await OtpRequest.deleteMany({
    userId: user._id,
    purpose,
    consumedAt: null
  });

  const row = await OtpRequest.create({
    requestId,
    purpose,
    userId: user._id,
    accountEmail,
    targetEmail: purpose === 'change_email' ? destination : '',
    otpHash: hashOtp({ requestId, purpose, otp }),
    attempts: 0,
    maxAttempts: env.otpMaxAttempts,
    expiresAt,
    requestedIp: request?.ip || '',
    requestedUserAgent: String(request?.headers?.['user-agent'] || '').slice(0, 500)
  });

  try {
    const delivery = await sendOtpEmail({
      to: destination,
      otp,
      purpose,
      expiresInMinutes: env.otpTtlMinutes
    });
    return {
      requestId,
      expiresAt,
      expiresInMinutes: env.otpTtlMinutes,
      destination: maskEmail(destination),
      channel: delivery.channel
    };
  } catch (error) {
    await OtpRequest.deleteOne({ _id: row._id }).catch(() => null);
    throw new AppError('Unable to deliver OTP at this time', 503);
  }
}

async function verifyOtpRequest({ requestId, purpose, otp, expectedUserId = null, expectedEmail = null }) {
  const id = String(requestId || '').trim();
  if (!/^[a-f0-9]{64}$/i.test(id)) throw new AppError('Invalid or expired OTP request', 400);

  const now = new Date();
  const row = await OtpRequest.findOne({
    requestId: id,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: now }
  }).select('+otpHash');

  if (!row) throw new AppError('Invalid or expired OTP request', 400);
  if (row.attempts >= row.maxAttempts) throw new AppError('OTP attempt limit exceeded', 429);
  if (expectedUserId && String(row.userId) !== String(expectedUserId)) throw new AppError('Invalid OTP request', 400);
  if (expectedEmail && normalizeEmail(row.accountEmail) !== normalizeEmail(expectedEmail)) throw new AppError('Invalid OTP request', 400);

  const candidate = hashOtp({ requestId: row.requestId, purpose, otp });
  if (!safeEqualHex(candidate, row.otpHash)) {
    const updated = await OtpRequest.findOneAndUpdate(
      { _id: row._id, consumedAt: null, attempts: { $lt: row.maxAttempts } },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!updated || updated.attempts >= updated.maxAttempts) {
      await OtpRequest.updateOne({ _id: row._id }, { $set: { consumedAt: new Date() } }).catch(() => null);
      throw new AppError('OTP attempt limit exceeded', 429);
    }
    throw new AppError('Invalid OTP code', 400);
  }

  const consumed = await OtpRequest.findOneAndUpdate(
    {
      _id: row._id,
      consumedAt: null,
      expiresAt: { $gt: now },
      attempts: { $lt: row.maxAttempts }
    },
    { $set: { consumedAt: now } },
    { new: true }
  ).select('+otpHash');

  if (!consumed) throw new AppError('OTP request has already been used', 409);
  return consumed;
}

async function deleteOtpRequest(row) {
  if (row?._id) await OtpRequest.deleteOne({ _id: row._id }).catch(() => null);
}

async function invalidateUserOtpRequests(userId, purpose) {
  await OtpRequest.deleteMany({ userId, purpose }).catch(() => null);
}

async function dummyOtpWork() {
  const requestId = generateRequestId();
  hashOtp({ requestId, purpose: 'password_reset', otp: generateOtp() });
  await new Promise((resolve) => setTimeout(resolve, crypto.randomInt(40, 90)));
  return requestId;
}

module.exports = {
  normalizeEmail,
  maskEmail,
  normalizeOtp,
  generateRequestId,
  createOtpRequest,
  verifyOtpRequest,
  deleteOtpRequest,
  invalidateUserOtpRequests,
  dummyOtpWork
};
