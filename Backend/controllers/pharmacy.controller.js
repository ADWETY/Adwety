const { z } = require('zod');
const { InventorySnapshot, Pharmacy } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError } = require('../utils/helpers');

exports.myInventorySchema = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

function serializeInventory(row) {
  const drug = row.drugId || {};
  return {
    id: row._id.toString(),
    pharmacy_id: row.pharmacyId?.toString?.() || String(row.pharmacyId),
    drug_id: drug._id?.toString?.() || row.drugId?.toString?.() || String(row.drugId || ''),
    drug: drug._id ? {
      id: drug._id.toString(),
      generic_name: drug.genericName,
      brand_names: drug.brandNames || [],
      aliases: drug.aliases || [],
      category: drug.category,
      dosage_form: drug.dosageForm,
      strength: drug.strength,
      description: drug.description || ''
    } : null,
    quantity: row.quantity,
    price: row.price || 0,
    source: row.source || '',
    updated_at: row.updatedAt,
    created_at: row.createdAt
  };
}

async function resolveAuthenticatedPharmacyId(user) {
  if (user.pharmacyId) return user.pharmacyId;
  const pharmacy = await Pharmacy.findOne({ ownerId: user._id }).select('_id').lean();
  return pharmacy?._id || null;
}

exports.myInventory = asyncHandler(async (req, res) => {
  // SECURITY: intentionally ignores any pharmacyId query/body/param. Tenant boundary
  // is derived only from the validated JWT identity attached by auth middleware.
  const pharmacyId = await resolveAuthenticatedPharmacyId(req.authUser);
  if (!pharmacyId) throw new AppError('No pharmacy is linked to the authenticated account', 404);

  const rows = await InventorySnapshot.find({ pharmacyId })
    .populate('drugId', 'genericName brandNames aliases category dosageForm strength description')
    .sort({ updatedAt: -1 })
    .lean();

  return success(res, { pharmacy_id: pharmacyId.toString(), data: rows.map(serializeInventory) }, 'My inventory loaded');
});
