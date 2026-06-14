'use strict';

const { User, Pharmacy, StoreWarehouse, StorePerson, StoreCategory } = require('../models');
const { AppError, isValidObjectId } = require('../utils/helpers');
const { runWithRetailTenant } = require('../services/retail-tenant.service');
const { ensureRetailIndexes } = require('../services/retail-indexes.service');

const provisioningByPharmacy = new Map();
const provisionedAtByPharmacy = new Map();
const DEFAULTS_RECHECK_MS = 5 * 60 * 1000;

async function resolvePharmacy(user) {
  if (user.pharmacyId) {
    const assigned = await Pharmacy.findOne({
      _id: user.pharmacyId,
      status: { $in: ['approved', 'active'] },
    }).select('_id name status ownerId').lean();
    if (assigned) return assigned;
  }

  return Pharmacy.findOne({
    ownerId: user._id,
    status: { $in: ['approved', 'active'] },
  }).sort({ createdAt: 1 }).select('_id name status ownerId').lean();
}

async function ensureRetailDefaults(req, pharmacy) {
  const pharmacyId = pharmacy._id;
  const ownerName = req.authUser.fullName || '';
  const ownerPhone = req.authUser.phoneNumber || '';

  await Promise.all([
    StoreWarehouse.findOneAndUpdate(
      { pharmacyId, code: 'MAIN' },
      {
        $setOnInsert: {
          pharmacyId,
          name: `${pharmacy.name} - Main Warehouse`,
          code: 'MAIN',
          address: '',
          manager: ownerName,
          phone: ownerPhone,
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ),
    StoreCategory.findOneAndUpdate(
      { pharmacyId, name: 'General' },
      {
        $setOnInsert: {
          pharmacyId,
          name: 'General',
          description: 'Default category for uncategorized products',
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ),
    StorePerson.findOneAndUpdate(
      { pharmacyId, type: 'customer', name: 'Walk-in Customer' },
      {
        $setOnInsert: {
          pharmacyId,
          type: 'customer',
          name: 'Walk-in Customer',
          phone: '',
          email: '',
          address: '',
          openingBalance: 0,
          balanceType: 'debit',
          notes: 'Default cash customer',
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ),
    StorePerson.findOneAndUpdate(
      { pharmacyId, type: 'supplier', name: 'General Supplier' },
      {
        $setOnInsert: {
          pharmacyId,
          type: 'supplier',
          name: 'General Supplier',
          phone: '',
          email: '',
          address: '',
          openingBalance: 0,
          balanceType: 'credit',
          notes: 'Default supplier',
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ),
  ]);
}

function ensureRetailDefaultsLocked(req, pharmacy) {
  const key = String(pharmacy._id);
  const lastProvisionedAt = provisionedAtByPharmacy.get(key) || 0;
  if ((Date.now() - lastProvisionedAt) < DEFAULTS_RECHECK_MS) {
    return Promise.resolve();
  }

  if (!provisioningByPharmacy.has(key)) {
    const task = ensureRetailDefaults(req, pharmacy)
      .catch(async (error) => {
        // Some upgraded databases still have obsolete global unique indexes
        // (for example code_1). Repair them once and retry provisioning so a
        // single legacy index cannot make every retail GET request return 409.
        if (error?.code !== 11000) throw error;
        await ensureRetailIndexes({ force: true });
        return ensureRetailDefaults(req, pharmacy);
      })
      .then(() => {
        provisionedAtByPharmacy.set(key, Date.now());
      })
      .finally(() => {
        provisioningByPharmacy.delete(key);
      });
    provisioningByPharmacy.set(key, task);
  }
  return provisioningByPharmacy.get(key);
}

async function retailTenant(req, _res, next) {
  try {
    if (req.authRole === 'admin') {
      const selectedPharmacyId = String(req.get('X-Pharmacy-ID') || '').trim();
      if (!selectedPharmacyId) {
        return next(new AppError('Select a pharmacy before accessing the retail workspace', 400, {
          code: 'RETAIL_PHARMACY_REQUIRED',
        }));
      }
      if (!isValidObjectId(selectedPharmacyId)) {
        return next(new AppError('Invalid selected pharmacy', 400, {
          code: 'RETAIL_PHARMACY_INVALID',
        }));
      }

      const pharmacy = await Pharmacy.findOne({
        _id: selectedPharmacyId,
        status: { $in: ['approved', 'active'] },
      }).select('_id name status ownerId').lean();
      if (!pharmacy) {
        return next(new AppError('The selected pharmacy is unavailable or inactive', 404, {
          code: 'RETAIL_PHARMACY_NOT_FOUND',
        }));
      }

      req.retailPharmacy = pharmacy;
      req.retailPharmacyId = pharmacy._id;
      return runWithRetailTenant(pharmacy._id, async () => {
        try {
          await ensureRetailDefaultsLocked(req, pharmacy);
          return next();
        } catch (error) {
          return next(error);
        }
      });
    }

    if (req.authRole !== 'pharmacist') {
      return next(new AppError('Retail access is limited to administrators and pharmacists', 403));
    }

    const pharmacy = await resolvePharmacy(req.authUser);
    if (!pharmacy) {
      return next(new AppError('No active pharmacy is linked to this account', 403));
    }

    // Older/demo pharmacist records may own a pharmacy without having the
    // direct pharmacyId field populated. Persist the resolved assignment once
    // so every future POS request targets the same business deterministically.
    if (!req.authUser.pharmacyId) {
      await User.updateOne(
        { _id: req.authUser._id, pharmacyId: null },
        { $set: { pharmacyId: pharmacy._id } }
      );
      req.authUser.pharmacyId = pharmacy._id;
    }

    req.retailPharmacy = pharmacy;
    req.retailPharmacyId = pharmacy._id;

    // Provision the minimum records needed by every selector before the request
    // reaches the retail controllers. Running this inside the tenant context also
    // guarantees that defaults can never leak between pharmacies.
    return runWithRetailTenant(pharmacy._id, async () => {
      try {
        await ensureRetailDefaultsLocked(req, pharmacy);
        return next();
      } catch (error) {
        return next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = retailTenant;
module.exports.resolvePharmacy = resolvePharmacy;
module.exports.getSelectedAdminPharmacyId = (req) => String(req.get('X-Pharmacy-ID') || '').trim();
module.exports.ensureRetailDefaults = ensureRetailDefaults;
module.exports.ensureRetailDefaultsLocked = ensureRetailDefaultsLocked;
