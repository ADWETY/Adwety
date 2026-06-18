const mongoose = require('mongoose');
const models = require('../../models');

const { escapeRegex } = require('../../utils/helpers');
const { findMatches } = require('../../services/drug-matching.service');

const { User, Pharmacy, Drug, InventorySnapshot } = models;

const AiLog = models.AiLog || mongoose.models.AiLog;
const SystemLog = models.SystemLog || mongoose.models.SystemLog;

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;
const DEFAULT_RADIUS_KM = 50;
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80';

function idOf(value) {
  if (!value) return '';
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

function distanceKm(a, b, c, d) {
  const R = 6371;
  const toRad = (x) => Number(x) * Math.PI / 180;

  const dLat = toRad(Number(c) - Number(a));
  const dLng = toRad(Number(d) - Number(b));

  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function userDto(user, tokens = null) {
  return {
    id: idOf(user),
    name: user.fullName || user.name || '',
    email: user.email || '',
    role: user.role || 'patient',
    phone_number: user.phoneNumber || '',
    pharmacy_id: user.pharmacyId ? idOf(user.pharmacyId) : null,
    token: tokens?.token || tokens?.access_token || tokens || null,
    access_token: tokens?.access_token || tokens?.token || null,
    refresh_token: tokens?.refresh_token || null,
    expires_in: tokens?.expires_in || null,
    password_policy_version: Number(user.passwordPolicyVersion || 1),
    password_upgrade_recommended: Number(user.passwordPolicyVersion || 1) < 2,
    mfa_enabled: user.mfaEnabled === true,
    mfa_policy_version: Number(user.mfaPolicyVersion || 1),
    mfa_grandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true
  };
}

function drugDto(drug) {
  return {
    id: idOf(drug),
    name: drug.genericName || drug.name || '',
    strength: drug.strength || '',
    form: drug.dosageForm || drug.form || '',
    description: drug.description || ''
  };
}

function medicineDto({ drug, inventory = null, pharmacy = null }) {
  const quantity = asNumber(inventory?.quantity, 0);

  return {
    id: idOf(drug),
    drug_id: idOf(drug),
    name: drug.genericName || drug.name || '',
    category: drug.category || 'General',
    price: asNumber(inventory?.price, 0),
    stock_status: quantity > 0 ? 'In stock' : 'Out of stock',
    image_url: drug.imageUrl || PLACEHOLDER_IMAGE,
    pharmacy_name: pharmacy?.name || '',
    pharmacy_id: pharmacy ? idOf(pharmacy) : null,
    quantity,
    strength: drug.strength || '',
    form: drug.dosageForm || drug.form || '',
    description: drug.description || ''
  };
}

function pharmacyDto(pharmacy, distance = null) {
  const rawDistance = distance ?? pharmacy.distance_km ?? 0;

  return {
    id: idOf(pharmacy),
    name: pharmacy.name || '',
    address: pharmacy.address || '',
    distance_km: Number(asNumber(rawDistance, 0).toFixed(2)),
    rating: asNumber(pharmacy.rating, 0),
    latitude: asNumber(pharmacy.latitude, DEFAULT_LAT),
    longitude: asNumber(pharmacy.longitude, DEFAULT_LNG),
    phone: pharmacy.phone || '',
    email: pharmacy.email || '',
    status: pharmacy.status || 'active',
    image_url: pharmacy.imageUrl || pharmacy.image_url || PLACEHOLDER_IMAGE,
    is_featured: pharmacy.isFeatured === true || pharmacy.is_featured === true
  };
}

function inventoryDto(item) {
  return {
    id: idOf(item),
    pharmacy_id: idOf(item.pharmacyId || item.pharmacy_id),
    drug_id: idOf(item.drugId || item.drug_id),
    price: asNumber(item.price, 0),
    quantity: asNumber(item.quantity, 0),
    updated_at: item.updatedAt || item.updated_at || null
  };
}

function searchResultDto({ drug, pharmacy, inventory, lat, lng }) {
  const distance = lat !== undefined && lng !== undefined
    ? distanceKm(lat, lng, pharmacy.latitude, pharmacy.longitude)
    : asNumber(pharmacy.distance_km, 0);

  return {
    drug: drugDto(drug),
    pharmacy: pharmacyDto(pharmacy, distance),
    inventory: inventoryDto(inventory)
  };
}

function notificationDto(item) {
  const quantity = asNumber(item.quantity, 0);
  const drug = item.drugId || item.drug_id || {};
  const pharmacy = item.pharmacyId || item.pharmacy_id || {};

  const drugName = drug.genericName || drug.name || 'Medicine';
  const pharmacyName = pharmacy.name || 'Pharmacy';
  const isOut = quantity <= 0;

  return {
    id: idOf(item),
    title: isOut ? 'Out of stock alert' : 'Low stock alert',
    message: `${drugName} is ${isOut ? 'out of stock' : 'low in stock'} in ${pharmacyName}. Qty: ${quantity}`,
    type: isOut ? 'out_of_stock' : 'low_stock',
    read: false,
    is_read: false,
    created_at: item.updatedAt || item.createdAt || new Date().toISOString(),
    drug_id: idOf(drug),
    pharmacy_id: idOf(pharmacy),
    quantity
  };
}

function file(req) {
  return req.file || (Array.isArray(req.files) ? req.files[0] : null);
}

async function countModel(Model) {
  if (!Model || typeof Model.countDocuments !== 'function') return 0;
  return Model.countDocuments();
}

async function activePharmacies({ q, lat, lng, radiusKm, limit }) {
  const finalLimit = Math.max(Number(limit) || 20, 1);
  const filter = { status: { $in: ['active', 'approved'] } };

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { name: rx },
      { address: rx },
      { phone: rx },
      { email: rx }
    ];
  }

  const rows = await Pharmacy.find(filter).limit(Math.max(finalLimit * 5, 100)).lean();
  const hasLocation = lat !== undefined && lng !== undefined;

  return rows
    .map((p) => ({
      ...p,
      distance_km: hasLocation ? distanceKm(lat, lng, p.latitude, p.longitude) : 0
    }))
    .filter((p) => !hasLocation || p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km || b.rating - a.rating)
    .slice(0, finalLimit);
}

async function rawSearchResults({
  query,
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  radiusKm = DEFAULT_RADIUS_KM,
  limit = 20
}) {
  if (!query) return [];

  const matches = await findMatches(query, { limit: 10, threshold: 0.4 });
  if (!matches.length) return [];

  const drugIds = matches.map((m) => new mongoose.Types.ObjectId(m.matchedDrugId));

  const pharmacies = await activePharmacies({
    lat,
    lng,
    radiusKm,
    limit: Math.max(limit, 20)
  });

  if (!pharmacies.length) return [];

  const pharmacyMap = new Map(pharmacies.map((p) => [idOf(p), p]));

  const inventory = await InventorySnapshot.find({
    drugId: { $in: drugIds },
    pharmacyId: { $in: pharmacies.map((p) => p._id) },
    quantity: { $gt: 0 }
  }).populate('drugId').lean();

  return inventory
    .map((item) => {
      const pharmacy = pharmacyMap.get(idOf(item.pharmacyId));
      const drug = item.drugId;

      if (!pharmacy || !drug) return null;

      return searchResultDto({
        drug,
        pharmacy,
        inventory: item,
        lat,
        lng
      });
    })
    .filter(Boolean)
    .sort((a, b) => {
      return a.pharmacy.distance_km - b.pharmacy.distance_km
        || b.inventory.quantity - a.inventory.quantity;
    })
    .slice(0, limit);
}

module.exports = {
  mongoose,
  models,

  User,
  Pharmacy,
  Drug,
  InventorySnapshot,
  AiLog,
  SystemLog,

  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_RADIUS_KM,
  PLACEHOLDER_IMAGE,

  idOf,
  distanceKm,
  asNumber,

  userDto,
  drugDto,
  medicineDto,
  pharmacyDto,
  inventoryDto,
  searchResultDto,
  notificationDto,

  file,
  countModel,
  activePharmacies,
  rawSearchResults
};
