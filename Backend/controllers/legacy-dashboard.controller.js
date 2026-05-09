const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, Pharmacy, Drug, Category, InventorySnapshot, AiLog, SystemLog } = require('../models');
const env = require('../config/env');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { signToken } = require('../services/token.service');
const { AppError, isValidObjectId, validateObjectId, pagination, escapeRegex } = require('../utils/helpers');
const { findMatches, serializeDrug } = require('../services/drug-matching.service');
const { callGemini } = require('../services/ai.service');
const { systemLog } = require('../services/logging.service');

function normalizeRole(role) {
  const aliases = { owner: 'admin', super_admin: 'admin', support_admin: 'admin', pharmacy_admin: 'pharmacist', user: 'patient' };
  return aliases[role] || role || 'patient';
}

function userDto(user, token = undefined) {
  const data = {
    id: String(user._id),
    _id: String(user._id),
    name: user.fullName,
    fullName: user.fullName,
    full_name: user.fullName,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || '',
    phone_number: user.phoneNumber || '',
    pharmacyId: user.pharmacyId || null,
    pharmacy_id: user.pharmacyId || null,
    isActive: user.isActive !== false,
    is_active: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  if (token !== undefined) data.token = token;
  return data;
}

function pharmacyDto(pharmacy) {
  return {
    id: String(pharmacy._id),
    _id: String(pharmacy._id),
    name: pharmacy.name,
    address: pharmacy.address,
    phone: pharmacy.phone || '',
    email: pharmacy.email || '',
    status: pharmacy.status,
    latitude: pharmacy.latitude,
    longitude: pharmacy.longitude,
    lat: pharmacy.latitude,
    lng: pharmacy.longitude,
    location: pharmacy.location,
    workingHours: pharmacy.workingHours || '',
    working_hours: pharmacy.workingHours || '',
    ownerId: pharmacy.ownerId || null,
    owner_id: pharmacy.ownerId || null,
    rating: pharmacy.rating || 0,
    createdAt: pharmacy.createdAt,
    updatedAt: pharmacy.updatedAt,
  };
}

function drugDto(drug) {
  const base = serializeDrug(drug);
  return {
    ...base,
    _id: String(drug._id),
    name: base.name || drug.genericName,
    genericName: drug.genericName,
    generic_name: drug.genericName,
    brandNames: drug.brandNames || [],
    brand_names: drug.brandNames || [],
    aliases: drug.aliases || [],
    category: drug.category,
    dosageForm: drug.dosageForm,
    dosage_form: drug.dosageForm,
    form: drug.dosageForm,
    strength: drug.strength,
    description: drug.description || '',
    isActive: drug.isActive !== false,
    is_active: drug.isActive !== false,
    createdAt: drug.createdAt,
    updatedAt: drug.updatedAt,
  };
}

function inventoryDto(item) {
  return {
    id: String(item._id),
    _id: String(item._id),
    pharmacyId: item.pharmacyId,
    pharmacy_id: item.pharmacyId,
    drugId: item.drugId,
    drug_id: item.drugId,
    quantity: item.quantity,
    price: item.price || 0,
    source: item.source,
    updatedAt: item.updatedAt,
    updated_at: item.updatedAt,
    createdAt: item.createdAt,
  };
}

function listMeta(query, total) {
  const p = pagination(query);
  return { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) };
}

function bodyString(body, keys, fallback = '') {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null && String(body[key]).trim() !== '') return String(body[key]).trim();
  }
  return fallback;
}

function parseCoords(body) {
  const latitude = Number(body.latitude ?? body.lat ?? body.coordinates?.lat ?? body.coordinates?.latitude ?? 30.0444);
  const longitude = Number(body.longitude ?? body.lng ?? body.coordinates?.lng ?? body.coordinates?.longitude ?? 31.2357);
  return { latitude, longitude };
}

function assertAdmin(req) {
  const role = normalizeRole(req.authRole);
  if (role !== 'admin') throw new AppError('Forbidden: dashboard admin access required', 403);
}

function assertDashboard(req) {
  const role = normalizeRole(req.authRole);
  if (!['admin', 'pharmacist'].includes(role)) throw new AppError('Forbidden: dashboard access required', 403);
}

async function ensureCategory(name) {
  if (!name) return null;
  return Category.findOneAndUpdate({ name }, { $setOnInsert: { description: '' } }, { upsert: true, new: true });
}

function drugPayload(body, existing = {}) {
  return {
    genericName: bodyString(body, ['genericName', 'generic_name', 'name'], existing.genericName),
    brandNames: body.brandNames || body.brand_names || body.brands || existing.brandNames || [],
    aliases: body.aliases || existing.aliases || [],
    category: bodyString(body, ['category'], existing.category || 'General'),
    dosageForm: bodyString(body, ['dosageForm', 'dosage_form', 'form'], existing.dosageForm),
    strength: bodyString(body, ['strength'], existing.strength),
    description: bodyString(body, ['description'], existing.description || ''),
    isActive: body.isActive ?? body.is_active ?? existing.isActive ?? true,
  };
}

exports.register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = bodyString(body, ['email']).toLowerCase();
  const password = bodyString(body, ['password']);
  const fullName = bodyString(body, ['fullName', 'full_name', 'name']);
  if (!email || !password || !fullName) throw new AppError('name, email and password are required', 422);
  const role = normalizeRole(body.role);
  if (role === 'admin' && !env.allowAdminRegister) throw new AppError('Admin self-registration is disabled', 403);
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already exists', 409);
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({ fullName, email, passwordHash, role, phoneNumber: body.phoneNumber || body.phone_number || '' });
  const token = signToken(user);
  return success(res, userDto(user, token), 'Register successful', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = bodyString(body, ['email']).toLowerCase();
  const password = bodyString(body, ['password']);
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.isActive === false) {
    await systemLog({ type: 'login_attempt', action: 'legacy.auth.login', success: false, message: 'Invalid dashboard login', metadata: { email }, ip: req.ip });
    throw new AppError('Invalid email or password', 401);
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user);
  await systemLog({ type: 'login_attempt', action: 'legacy.auth.login', actorId: user._id, actorRole: user.role, success: true, message: 'Dashboard login successful', ip: req.ip });
  return success(res, userDto(user, token), 'Login successful');
});

exports.logout = asyncHandler(async (_req, res) => success(res, { logged_out: true }, 'Logout successful'));
exports.otpOk = asyncHandler(async (_req, res) => success(res, { otp_required: false, verified: true }, 'OTP step is disabled in this backend version; request accepted for legacy compatibility.'));
exports.me = asyncHandler(async (req, res) => success(res, userDto(req.authUser), 'Profile loaded'));

exports.updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (body.fullName || body.full_name || body.name) req.authUser.fullName = bodyString(body, ['fullName', 'full_name', 'name'], req.authUser.fullName);
  if (body.phoneNumber !== undefined || body.phone_number !== undefined) req.authUser.phoneNumber = body.phoneNumber || body.phone_number || '';
  await req.authUser.save();
  return success(res, userDto(req.authUser), 'Profile updated');
});

exports.listMedicines = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const p = pagination(req.query);
  const filter = {};
  const q = req.query.q || req.query.search || req.query.query;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ genericName: rx }, { brandNames: rx }, { aliases: rx }, { category: rx }, { dosageForm: rx }, { strength: rx }];
  }
  if (req.query.category) filter.category = new RegExp(`^${escapeRegex(req.query.category)}$`, 'i');
  if (req.query.isActive !== undefined || req.query.is_active !== undefined) filter.isActive = String(req.query.isActive ?? req.query.is_active) !== 'false';
  const [rows, total] = await Promise.all([Drug.find(filter).sort({ genericName: 1 }).skip(p.skip).limit(p.limit).lean(), Drug.countDocuments(filter)]);
  return success(res, { data: rows.map(drugDto), pagination: listMeta(req.query, total) }, 'Medicines loaded');
});

exports.searchMedicines = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const q = req.query.q || req.query.query || req.query.drug || req.query.search;
  if (!q) throw new AppError('Search query is required', 422);
  const results = await findMatches(q, { limit: Math.min(25, Number(req.query.limit || 10)) });
  return success(res, results, 'Medicine search completed');
});

exports.getMedicine = asyncHandler(async (req, res) => {
  assertDashboard(req);
  validateObjectId(req.params.id);
  const drug = await Drug.findById(req.params.id).lean();
  if (!drug) throw new AppError('Medicine not found', 404);
  return success(res, drugDto(drug), 'Medicine loaded');
});

exports.createMedicine = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const data = drugPayload(req.body || {});
  if (!data.genericName || !data.dosageForm || !data.strength) throw new AppError('genericName/name, dosageForm/form and strength are required', 422);
  await ensureCategory(data.category);
  const drug = await Drug.create(data);
  return success(res, drugDto(drug), 'Medicine created', 201);
});

exports.updateMedicine = asyncHandler(async (req, res) => {
  assertDashboard(req);
  validateObjectId(req.params.id);
  const drug = await Drug.findById(req.params.id);
  if (!drug) throw new AppError('Medicine not found', 404);
  const data = drugPayload(req.body || {}, drug.toObject());
  Object.assign(drug, data);
  await ensureCategory(drug.category);
  await drug.save();
  return success(res, drugDto(drug), 'Medicine updated');
});

exports.deleteMedicine = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const deleted = await Drug.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError('Medicine not found', 404);
  await InventorySnapshot.deleteMany({ drugId: deleted._id });
  return success(res, { deleted: true }, 'Medicine deleted');
});

exports.listPharmacies = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const p = pagination(req.query);
  const filter = {};
  const q = req.query.q || req.query.search || req.query.query;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { address: rx }, { phone: rx }, { email: rx }];
  }
  if (req.query.status) filter.status = req.query.status;
  const [rows, total] = await Promise.all([Pharmacy.find(filter).sort({ name: 1 }).skip(p.skip).limit(p.limit).lean(), Pharmacy.countDocuments(filter)]);
  return success(res, { data: rows.map(pharmacyDto), pagination: listMeta(req.query, total) }, 'Pharmacies loaded');
});

exports.getPharmacy = asyncHandler(async (req, res) => {
  assertDashboard(req);
  validateObjectId(req.params.id);
  const pharmacy = await Pharmacy.findById(req.params.id).lean();
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  return success(res, pharmacyDto(pharmacy), 'Pharmacy loaded');
});

exports.createPharmacy = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const body = req.body || {};
  const { latitude, longitude } = parseCoords(body);
  const name = bodyString(body, ['name']);
  const address = bodyString(body, ['address']);
  if (!name || !address) throw new AppError('name and address are required', 422);
  const pharmacy = await Pharmacy.create({
    name,
    address,
    phone: body.phone || '',
    email: body.email || '',
    status: body.status || 'active',
    latitude,
    longitude,
    workingHours: body.workingHours || body.working_hours || '',
    ownerId: body.ownerId || body.owner_id || null,
    rating: body.rating || 0,
  });
  return success(res, pharmacyDto(pharmacy), 'Pharmacy created', 201);
});

exports.updatePharmacy = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const pharmacy = await Pharmacy.findById(req.params.id);
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  const body = req.body || {};
  for (const key of ['name', 'address', 'phone', 'email', 'status', 'rating']) if (body[key] !== undefined) pharmacy[key] = body[key];
  if (body.workingHours !== undefined || body.working_hours !== undefined) pharmacy.workingHours = body.workingHours || body.working_hours || '';
  if (body.ownerId !== undefined || body.owner_id !== undefined) pharmacy.ownerId = body.ownerId || body.owner_id || null;
  if (body.latitude !== undefined || body.lat !== undefined || body.longitude !== undefined || body.lng !== undefined) {
    const { latitude, longitude } = parseCoords({ ...pharmacy.toObject(), ...body });
    pharmacy.latitude = latitude;
    pharmacy.longitude = longitude;
  }
  await pharmacy.save();
  return success(res, pharmacyDto(pharmacy), 'Pharmacy updated');
});

exports.deletePharmacy = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const deleted = await Pharmacy.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError('Pharmacy not found', 404);
  await InventorySnapshot.deleteMany({ pharmacyId: deleted._id });
  return success(res, { deleted: true }, 'Pharmacy deleted');
});

exports.notifications = asyncHandler(async (_req, res) => success(res, { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }, 'Notifications loaded'));

exports.scanPrescription = asyncHandler(async (req, res) => {
  const firstFile = Array.isArray(req.files) ? req.files[0] : req.file;
  const text = req.body?.text || req.body?.prescriptionText || req.body?.mock_text || '';
  const raw = await callGemini({ buffer: firstFile?.buffer, mimeType: firstFile?.mimetype, text });
  const extracted = Array.isArray(raw.drugs) ? raw.drugs : [];
  const matched = [];
  for (const item of extracted) {
    const extractedName = item.extracted_name || item.name || '';
    const matches = await findMatches(extractedName, { limit: 1, threshold: 0.45 });
    matched.push({
      extracted_name: extractedName,
      confidence: Number(item.confidence_score || item.confidence || 0.5),
      matched_drug_id: matches[0]?.matchedDrugId || null,
      matched_drug_name: matches[0]?.matchedDrugName || null,
      matched_drug: matches[0]?.drug || null,
    });
  }
  const result = { extracted_text: raw.extracted_text || text, extracted_drugs: matched, drugs: matched };
  return success(res, result, 'Prescription scanned');
});

exports.admins = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const p = pagination(req.query);
  const [rows, total] = await Promise.all([User.find({ role: 'admin' }).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(), User.countDocuments({ role: 'admin' })]);
  return success(res, { data: rows.map(userDto), pagination: listMeta(req.query, total) }, 'Admins loaded');
});

exports.createAdmin = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const body = req.body || {};
  const email = bodyString(body, ['email']).toLowerCase();
  const password = bodyString(body, ['password']);
  const fullName = bodyString(body, ['fullName', 'full_name', 'name']);
  if (!email || !password || !fullName) throw new AppError('name, email and password are required', 422);
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already exists', 409);
  const user = await User.create({ fullName, email, passwordHash: await bcrypt.hash(password, env.bcryptSaltRounds), role: 'admin', phoneNumber: body.phoneNumber || body.phone_number || '' });
  return success(res, userDto(user), 'Admin created', 201);
});

exports.updateAdmin = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Admin not found', 404);
  if (req.body?.fullName || req.body?.full_name || req.body?.name) user.fullName = bodyString(req.body, ['fullName', 'full_name', 'name'], user.fullName);
  if (req.body?.phoneNumber !== undefined || req.body?.phone_number !== undefined) user.phoneNumber = req.body.phoneNumber || req.body.phone_number || '';
  if (req.body?.isActive !== undefined || req.body?.is_active !== undefined) user.isActive = req.body.isActive ?? req.body.is_active;
  await user.save();
  return success(res, userDto(user), 'Admin updated');
});

exports.deleteAdmin = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const deleted = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
  if (!deleted) throw new AppError('Admin not found', 404);
  return success(res, { deleted: true }, 'Admin deleted');
});

exports.approvalRequests = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const p = pagination(req.query);
  const filter = { status: req.query.status || 'pending' };
  const [rows, total] = await Promise.all([Pharmacy.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(), Pharmacy.countDocuments(filter)]);
  return success(res, { data: rows.map(pharmacyDto), pagination: listMeta(req.query, total) }, 'Approval requests loaded');
});

exports.approveRequest = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  if (!pharmacy) throw new AppError('Approval request not found', 404);
  return success(res, pharmacyDto(pharmacy), 'Approval request approved');
});

exports.rejectRequest = asyncHandler(async (req, res) => {
  assertAdmin(req);
  validateObjectId(req.params.id);
  const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!pharmacy) throw new AppError('Approval request not found', 404);
  return success(res, pharmacyDto(pharmacy), 'Approval request rejected');
});

exports.legacyAnalytics = asyncHandler(async (req, res) => {
  assertAdmin(req);
  const [users, pharmacies, medicines, inventory, aiLogs, systemLogs] = await Promise.all([
    User.countDocuments(), Pharmacy.countDocuments(), Drug.countDocuments(), InventorySnapshot.countDocuments(), AiLog.countDocuments(), SystemLog.countDocuments()
  ]);
  return success(res, { users, pharmacies, medicines, drugs: medicines, inventory, aiLogs, systemLogs }, 'Legacy analytics loaded');
});

exports.syncInventory = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const pharmacyId = req.body?.pharmacyId || req.body?.pharmacy_id;
  if (!isValidObjectId(pharmacyId)) throw new AppError('pharmacyId is required', 422);
  const items = Array.isArray(req.body?.inventory) ? req.body.inventory : [];
  if (!items.length) throw new AppError('inventory array is required', 422);
  const now = new Date();
  const ops = items.map((item) => {
    const drugId = item.drugId || item.drug_id || item.medicineId || item.medicine_id;
    if (!isValidObjectId(drugId)) throw new AppError('Every inventory item requires drugId/medicineId', 422);
    return {
      updateOne: {
        filter: { pharmacyId: new mongoose.Types.ObjectId(pharmacyId), drugId: new mongoose.Types.ObjectId(drugId) },
        update: { $set: { quantity: Number(item.quantity || 0), price: Number(item.price || 0), updatedAt: now, source: 'dashboard_legacy' }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    };
  });
  const result = await InventorySnapshot.bulkWrite(ops, { ordered: false });
  return success(res, { pharmacy_id: pharmacyId, synced_items: items.length, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount, updated_at: now }, 'Inventory synced');
});

exports.listInventory = asyncHandler(async (req, res) => {
  assertDashboard(req);
  const p = pagination(req.query);
  const filter = {};
  if (isValidObjectId(req.query.pharmacyId || req.query.pharmacy_id)) filter.pharmacyId = req.query.pharmacyId || req.query.pharmacy_id;
  if (isValidObjectId(req.query.drugId || req.query.drug_id || req.query.medicineId || req.query.medicine_id)) filter.drugId = req.query.drugId || req.query.drug_id || req.query.medicineId || req.query.medicine_id;
  const [rows, total] = await Promise.all([InventorySnapshot.find(filter).sort({ updatedAt: -1 }).skip(p.skip).limit(p.limit).lean(), InventorySnapshot.countDocuments(filter)]);
  return success(res, { data: rows.map(inventoryDto), pagination: listMeta(req.query, total) }, 'Inventory loaded');
});
