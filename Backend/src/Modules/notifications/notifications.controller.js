const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./notifications.service');
exports.list = asyncHandler(async (req, res) => success(res, await service.listNotifications(req.authUser?._id || null), 'Notifications fetched successfully'));
