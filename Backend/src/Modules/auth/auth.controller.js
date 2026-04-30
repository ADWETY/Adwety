const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const authService = require('./auth.service');
const { setAuthCookies, clearAuthCookies } = require('../../middleware/security');

function pickSessionPayload(payload, csrfToken) {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    phone_number: payload.phone_number || '',
    role: payload.role,
    account_type: payload.account_type,
    email_verified: Boolean(payload.email_verified),
    phone_verified: Boolean(payload.phone_verified),
    csrf_token: csrfToken,
  };
}

function attachCookieSession(res, payload) {
  if (!payload?.token) return payload;
  const csrfToken = setAuthCookies(res, payload.token);
  return pickSessionPayload(payload, csrfToken);
}

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.validated.body);
  return success(res, attachCookieSession(res, result), 'Registration started', 201);
});

exports.verifyRegisterOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegisterOtp(req.validated.body);
  return success(res, attachCookieSession(res, result), 'Account verified successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.validated.body);
  return success(res, attachCookieSession(res, result), 'Login step completed');
});

exports.verifyLoginOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyLoginOtp(req.validated.body);
  return success(res, attachCookieSession(res, result), 'Login successful');
});

exports.forgotPassword = asyncHandler(async (req, res) => success(res, await authService.forgotPassword(req.validated.body), 'Password reset OTP queued'));
exports.resetPassword = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return success(res, await authService.resetPassword(req.validated.body), 'Password reset successfully');
});

exports.logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  return success(res, { logged_out: true }, 'Logged out successfully');
});
