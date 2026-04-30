const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./profile.service');

exports.getProfile = asyncHandler(async (req, res) => success(res, await service.getProfile(req.authUser || null, req.authMeta || null), 'Profile fetched successfully'));
exports.updateProfile = asyncHandler(async (req, res) => success(res, await service.updateProfile(req.authUser || null, req.authMeta || null, req.validated.body), 'Profile updated successfully'));
exports.requestEmailUpdate = asyncHandler(async (req, res) => success(res, await service.requestEmailUpdate(req.authUser || null, req.authMeta || null, req.validated.body), 'Profile update OTP sent'));
exports.confirmEmailUpdate = asyncHandler(async (req, res) => success(res, await service.confirmEmailUpdate(req.authUser || null, req.authMeta || null, req.validated.body), 'Email updated successfully'));
