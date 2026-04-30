const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const authService = require('./auth.service');
const { setAuthCookies, clearAuthCookies } = require('../../middleware/security');

function attachCookieSession(res, payload) {
  if (!payload?.token) return payload;
  const csrfToken = setAuthCookies(res, payload.token);
  const { token, ...safePayload } = payload;
  return { ...safePayload, csrf_token: csrfToken };
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
