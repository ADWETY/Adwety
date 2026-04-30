const asyncHandler = require('../../utils/async-handler');
const success = require('../../utils/response');
const service = require('./pharmacies.service');

exports.list = asyncHandler(async (req, res) => success(res, await service.listPharmacies(req.validated.query), 'Pharmacies fetched successfully'));
exports.getById = asyncHandler(async (req, res) => success(res, await service.getPharmacyDetails(req.validated.params.id), 'Pharmacy details fetched successfully'));
exports.create = asyncHandler(async (req, res) => success(res, await service.createPharmacy(req.validated.body), 'Pharmacy created successfully', 201));
exports.update = asyncHandler(async (req, res) => success(res, await service.updatePharmacy(req.validated.params.id, req.validated.body), 'Pharmacy updated successfully'));
exports.remove = asyncHandler(async (req, res) => success(res, await service.deletePharmacy(req.validated.params.id), 'Pharmacy deleted successfully'));
