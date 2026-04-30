const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./profile.service');
exports.getProfile = asyncHandler(async (req, res) => success(res, await service.getProfile(req.authUser || null, req.authMeta || null), 'Profile fetched successfully'));
