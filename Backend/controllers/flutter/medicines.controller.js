const mongoose = require('mongoose');

const asyncHandler = require('../../utils/async-handler');
const { AppError, validateObjectId } = require('../../utils/helpers');
const { findMatches } = require('../../services/drug-matching.service');

const {
  Drug,
  InventorySnapshot,
  medicineDto,
  drugDto
} = require('./common');

exports.medicines = asyncHandler(async (req, res) => {
  const q = req.validated.query.q
    || req.validated.query.query
    || req.validated.query.drug;

  const limit = req.validated.query.limit;

  if (q) {
    const matches = await findMatches(q, { limit: 25, threshold: 0.35 });

    if (!matches.length) {
      return res.json([]);
    }

    const drugIds = matches.map((m) => new mongoose.Types.ObjectId(m.matchedDrugId));

    const inventory = await InventorySnapshot.find({
      drugId: { $in: drugIds },
      quantity: { $gt: 0 }
    })
      .populate('drugId')
      .populate('pharmacyId')
      .limit(limit)
      .lean();

    if (inventory.length) {
      return res.json(inventory.map((item) => medicineDto({
        drug: item.drugId,
        inventory: item,
        pharmacy: item.pharmacyId
      })));
    }

    return res.json(matches.slice(0, limit).map((m) => medicineDto({
      drug: {
        _id: m.matchedDrugId,
        genericName: m.drug.generic_name,
        category: m.drug.category,
        dosageForm: m.drug.dosage_form,
        strength: m.drug.strength,
        description: m.drug.description
      }
    })));
  }

  const drugs = await Drug.find({ isActive: { $ne: false } })
    .sort({ genericName: 1 })
    .limit(limit)
    .lean();

  return res.json(drugs.map((drug) => medicineDto({ drug })));
});

exports.medicineDetails = asyncHandler(async (req, res) => {
  validateObjectId(req.validated.params.id);

  const drug = await Drug.findById(req.validated.params.id).lean();

  if (!drug || drug.isActive === false) {
    throw new AppError('Medicine not found', 404);
  }

  return res.json(drugDto(drug));
});

exports.drugSearch = asyncHandler(async (req, res) => {
  const q = req.validated.query.q
    || req.validated.query.query
    || req.validated.query.drug;

  if (!q) {
    const rows = await Drug.find({ isActive: { $ne: false } })
      .sort({ genericName: 1 })
      .limit(req.validated.query.limit)
      .lean();

    return res.json(rows.map(drugDto));
  }

  const matches = await findMatches(q, {
    limit: req.validated.query.limit,
    threshold: 0.35
  });

  return res.json(matches.map((m) => drugDto({
    _id: m.matchedDrugId,
    genericName: m.drug.generic_name,
    dosageForm: m.drug.dosage_form,
    strength: m.drug.strength,
    description: m.drug.description
  })));
});
