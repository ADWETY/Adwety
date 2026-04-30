const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const authService = require('./auth.service');

exports.register = asyncHandler(async (req, res) => success(res, await authService.registerUser(req.validated.body), 'Registration started', 201));
exports.verifyRegisterOtp = asyncHandler(async (req, res) => success(res, await authService.verifyRegisterOtp(req.validated.body), 'Account verified successfully'));
exports.login = asyncHandler(async (req, res) => success(res, await authService.loginUser(req.validated.body), 'Login step completed'));
exports.verifyLoginOtp = asyncHandler(async (req, res) => success(res, await authService.verifyLoginOtp(req.validated.body), 'Login successful'));
exports.forgotPassword = asyncHandler(async (req, res) => success(res, await authService.forgotPassword(req.validated.body), 'Password reset OTP queued'));
exports.resetPassword = asyncHandler(async (req, res) => success(res, await authService.resetPassword(req.validated.body), 'Password reset successfully'));
