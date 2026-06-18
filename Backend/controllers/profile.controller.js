const { z } = require('zod');
const { User } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError } = require('../utils/helpers');
const { verifyPassword, hashPassword } = require('../services/password.service');
const { invalidateUserSessions } = require('../services/session.service');
const { clearSessionCookies } = require('../services/http-session.service');
const {
  normalizeEmail,
  createOtpRequest,
  verifyOtpRequest,
  invalidateUserOtpRequests
} = require('../services/otp.service');

const requestIdSchema = z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid OTP request id');
function requestIdFrom(body) { return body.requestId || body.request_id || body.otp_token; }

exports.requestEmailOtpSchema = z.object({
  body: z.object({ email: z.string().email().max(254) }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.confirmEmailOtpSchema = z.object({
  body: z.object({
    requestId: requestIdSchema.optional(),
    request_id: requestIdSchema.optional(),
    otp_token: requestIdSchema.optional(),
    otp: z.string().min(6).max(12)
  }).strict().refine((v) => requestIdFrom(v), 'OTP request id is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

function userDto(user) {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    name: user.fullName,
    fullName: user.fullName,
    full_name: user.fullName,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || '',
    phone_number: user.phoneNumber || '',
    pharmacyId: user.pharmacyId || null,
    pharmacy_id: user.pharmacyId || null,
    isActive: user.isActive !== false,
    is_active: user.isActive !== false,
    createdAt: user.createdAt,
    created_at: user.createdAt,
    updatedAt: user.updatedAt,
    updated_at: user.updatedAt,
    passwordPolicyVersion: Number(user.passwordPolicyVersion || 1),
    password_policy_version: Number(user.passwordPolicyVersion || 1),
    passwordUpgradeRecommended: Number(user.passwordPolicyVersion || 1) < 2,
    password_upgrade_recommended: Number(user.passwordPolicyVersion || 1) < 2,
    mfaEnabled: user.mfaEnabled === true,
    mfa_enabled: user.mfaEnabled === true,
    mfaPolicyVersion: Number(user.mfaPolicyVersion || 1),
    mfa_policy_version: Number(user.mfaPolicyVersion || 1),
    mfaGrandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true,
    mfa_grandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true
  };
}

exports.me = asyncHandler(async (req, res) => success(res, userDto(req.authUser), 'Profile loaded'));

exports.updateProfile = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (body.fullName || body.full_name || body.name) req.authUser.fullName = body.fullName || body.full_name || body.name;
  if (body.phoneNumber !== undefined || body.phone_number !== undefined) req.authUser.phoneNumber = body.phoneNumber ?? body.phone_number ?? '';
  await req.authUser.save();
  return success(res, userDto(req.authUser), 'Profile updated');
});

exports.requestEmailOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.validated.body.email);
  const exists = await User.findOne({ email, _id: { $ne: req.authUser._id } });
  if (exists) throw new AppError('Email already exists', 409);

  const created = await createOtpRequest({
    purpose: 'change_email',
    user: req.authUser,
    targetEmail: email,
    request: req
  });

  const payload = {
    request_id: created.requestId,
    requestId: created.requestId,
    otp_token: created.requestId,
    expires_in_minutes: created.expiresInMinutes,
    delivery: { channel: created.channel, destination: created.destination }
  };
  return success(res, payload, 'Email verification code sent');
});

exports.confirmEmailOtp = asyncHandler(async (req, res) => {
  const otpRequest = await verifyOtpRequest({
    requestId: requestIdFrom(req.validated.body),
    purpose: 'change_email',
    otp: req.validated.body.otp,
    expectedUserId: req.authUser._id
  });

  const targetEmail = normalizeEmail(otpRequest.targetEmail);
  const exists = await User.findOne({ email: targetEmail, _id: { $ne: req.authUser._id } });
  if (exists) throw new AppError('Email already exists', 409);

  req.authUser.email = targetEmail;
  await req.authUser.save();
  await invalidateUserOtpRequests(req.authUser._id, 'change_email');
  return success(res, userDto(req.authUser), 'Email updated');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.authUser._id).select('+passwordHash');
  if (!user) throw new AppError('Unauthorized', 401);
  const ok = await verifyPassword(req.validated.body.currentPassword || req.validated.body.current_password, user.passwordHash);
  if (!ok) throw new AppError('Current password is incorrect', 400);
  user.passwordHash = await hashPassword(req.validated.body.newPassword || req.validated.body.new_password, { email: user.email, fullName: user.fullName });
  user.passwordPolicyVersion = 2;
  user.passwordChangedAt = new Date();
  await user.save();
  await invalidateUserSessions(user._id, 'password_change', { incrementVersion: true });
  await invalidateUserOtpRequests(user._id, 'password_reset');
  clearSessionCookies(res);
  return success(res, { password_changed: true }, 'Password changed successfully');
});
