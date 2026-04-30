const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./admins.service');

exports.list = asyncHandler(async (req, res) => success(res, await service.listAdmins(req.query), 'Admins loaded'));
exports.create = asyncHandler(async (req, res) => success(res, await service.createAdmin(req.body), 'Admin created', 201));
exports.update = asyncHandler(async (req, res) => success(res, await service.updateAdmin(req.params.id, req.body, req.authUser._id), 'Admin updated'));
exports.remove = asyncHandler(async (req, res) => success(res, await service.deleteAdmin(req.params.id, req.authUser._id), 'Admin deleted'));
