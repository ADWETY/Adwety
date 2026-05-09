const asyncHandler = require('../../utils/async-handler');
const { AppError, validateObjectId } = require('../../utils/helpers');

const {
  Pharmacy,
  InventorySnapshot,
  activePharmacies,
  pharmacyDto,
  distanceKm,
  searchResultDto
} = require('./common');

exports.pharmacies = asyncHandler(async (req, res) => {
  const q = req.validated.query.q || req.validated.query.query;

  const rows = await activePharmacies({
    q,
    lat: req.validated.query.lat,
    lng: req.validated.query.lng,
    radiusKm: req.validated.query.radius_km,
    limit: req.validated.query.limit
  });

  return res.json(rows.map((p) => pharmacyDto(p, p.distance_km)));
});

exports.pharmacyDetails = asyncHandler(async (req, res) => {
  validateObjectId(req.validated.params.id);

  const pharmacy = await Pharmacy.findById(req.validated.params.id).lean();

  if (!pharmacy) {
    throw new AppError('Pharmacy not found', 404);
  }

  const lat = req.validated.query.lat;
  const lng = req.validated.query.lng;

  const pDto = pharmacyDto(
    pharmacy,
    lat !== undefined && lng !== undefined
      ? distanceKm(lat, lng, pharmacy.latitude, pharmacy.longitude)
      : 0
  );

  const inventory = await InventorySnapshot.find({ pharmacyId: pharmacy._id })
    .populate('drugId')
    .sort({ quantity: -1, updatedAt: -1 })
    .lean();

  const items = inventory
    .filter((item) => item.drugId)
    .map((item) => searchResultDto({
      drug: item.drugId,
      pharmacy,
      inventory: item,
      lat: pDto.latitude,
      lng: pDto.longitude
    }));

  return res.json({
    pharmacy: pDto,
    inventory: items
  });
});
