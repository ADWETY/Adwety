const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./approval-requests.service');

exports.list = asyncHandler(async (req, res) => success(res, await service.listRequests(req.query), 'Approval requests loaded'));
exports.approve = asyncHandler(async (req, res) => success(res, await service.approveRequest(req.params.id, req.authUser._id), 'Request approved'));
exports.reject = asyncHandler(async (req, res) => success(res, await service.rejectRequest(req.params.id, req.authUser._id, req.body?.rejection_reason || ''), 'Request rejected'));
