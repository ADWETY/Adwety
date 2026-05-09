const asyncHandler = require('../../utils/async-handler');

const {
  DEFAULT_LAT,
  DEFAULT_LNG,
  rawSearchResults
} = require('./common');

exports.search = asyncHandler(async (req, res) => {
  const q = req.validated.query.q
    || req.validated.query.query
    || req.validated.query.drug;

  const results = await rawSearchResults({
    query: q,
    lat: req.validated.query.lat ?? DEFAULT_LAT,
    lng: req.validated.query.lng ?? DEFAULT_LNG,
    radiusKm: req.validated.query.radius_km,
    limit: req.validated.query.limit
  });

  return res.json(results);
});
