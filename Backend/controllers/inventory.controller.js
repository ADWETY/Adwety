const { z } = require('zod');
const mongoose = require('mongoose');
const { InventorySnapshot, Pharmacy, Drug } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, isValidObjectId, validateObjectId } = require('../utils/helpers');
const { systemLog } = require('../services/logging.service');
const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
exports.syncSchema = z.object({
  body: z.object({
    pharmacyId: objectId.optional(),
    pharmacy_id: objectId.optional(),
    inventory: z.array(z.object({
      drugId: objectId.optional(),
      drug_id: objectId.optional(),
      quantity: z.coerce.number().int().min(0),
      price: z.coerce.number().min(0).optional().default(0)
    }).strict().refine((v) => v.drugId || v.drug_id, 'drugId is required')).min(1).max(1000)
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

async function resolveAuthenticatedPharmacyId(user) {
  if (user.pharmacyId) return user.pharmacyId;
  const owned = await Pharmacy.findOne({ ownerId: user._id }).select('_id').lean();
  return owned?._id || null;
}

exports.sync = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const requestedPharmacyId = body.pharmacyId || body.pharmacy_id || null;
  let pharmacyId = requestedPharmacyId;

  // SECURITY: pharmacists never choose their tenant boundary. It is derived
  // from the authenticated JWT identity. Admins retain the explicit pharmacyId
  // workflow for platform-level inventory administration.
  if (req.authRole === 'pharmacist') {
    const linkedPharmacyId = await resolveAuthenticatedPharmacyId(req.authUser);
    if (!linkedPharmacyId) throw new AppError('No pharmacy is linked to the authenticated account', 404);
    if (requestedPharmacyId && String(requestedPharmacyId) !== String(linkedPharmacyId)) {
      throw new AppError('Forbidden: pharmacists can only sync their own pharmacy', 403);
    }
    pharmacyId = linkedPharmacyId;
  } else if (!pharmacyId) {
    throw new AppError('pharmacyId is required for admin inventory sync', 422);
  }

  validateObjectId(String(pharmacyId), 'pharmacyId');
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);

  const drugIds = body.inventory.map((x) => x.drugId || x.drug_id);
  const found = await Drug.find({ _id: { $in: drugIds }, isActive: { $ne: false } }).select('_id').lean();
  const foundSet = new Set(found.map((d) => String(d._id)));
  const missing = drugIds.filter((id) => !foundSet.has(String(id)));
  if (missing.length) throw new AppError('Some active drugs were not found', 404, { missing_drug_ids: missing });

  const now = new Date();
  const ops = body.inventory.map((item) => ({
    updateOne: {
      filter: {
        pharmacyId: new mongoose.Types.ObjectId(String(pharmacyId)),
        drugId: new mongoose.Types.ObjectId(item.drugId || item.drug_id)
      },
      update: {
        $set: {
          quantity: Number(item.quantity),
          price: Number(item.price || 0),
          updatedAt: now,
          source: 'pos_snapshot'
        },
        $setOnInsert: { createdAt: now }
      },
      upsert: true
    }
  }));

  const result = await InventorySnapshot.bulkWrite(ops, { ordered: false });
  await systemLog({
    type: 'sync',
    action: 'inventory.sync',
    actorId: req.authUser._id,
    actorRole: req.authRole,
    message: 'Inventory snapshot synced',
    metadata: { pharmacyId: String(pharmacyId), items: body.inventory.length }
  });

  return success(res, {
    pharmacy_id: String(pharmacyId),
    synced_items: body.inventory.length,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
    updated_at: now
  }, 'Inventory synced');
});
