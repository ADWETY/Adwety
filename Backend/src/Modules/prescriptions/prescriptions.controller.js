const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./prescriptions.service');
exports.scan = asyncHandler(async (req, res) => success(res, await service.scanPrescription({ file: req.file, userId: req.authUser?._id || null, mockText: req.validated.body.mock_text }), 'Prescription processed successfully', 201));
