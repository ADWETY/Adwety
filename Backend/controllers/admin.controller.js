const mongoose = require('mongoose');
const { z } = require('zod');
const { User, Pharmacy, Drug, InventorySnapshot, Category, AiLog, SystemLog, Notification } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { isValidObjectId, validateObjectId, pagination, escapeRegex, AppError } = require('../utils/helpers');
const { beginLogin } = require('../services/login.service');
const { hashPassword } = require('../services/password.service');
const { invalidateUserSessions, revokeSession } = require('../services/session.service');
const { setSessionCookies } = require('../services/http-session.service');
const { decryptJson } = require('../services/data-protection.service');
const { systemLog } = require('../services/logging.service');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const passwordSchema = z.string().min(12).max(128);
const roleEnum = z.enum(['admin', 'pharmacist', 'patient']);
const statusEnum = z.enum(['pending', 'approved', 'active', 'inactive', 'rejected']);
const arr = z.array(z.string().trim().min(1).max(120)).optional().default([]);

function listQuery(extra = {}) {
  return z.object({
    q: z.string().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    ...extra
  }).passthrough();
}

exports.loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1).max(128) }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});
exports.emptySchema = z.object({ body: z.object({}).strict(), query: z.object({}).passthrough(), params: z.object({}).strict() });
exports.byIdSchema = z.object({ body: z.object({}).strict(), query: z.object({}).strict(), params: z.object({ id: objectId }) });
exports.logByIdSchema = z.object({ body: z.object({}).strict(), query: z.object({ source: z.enum(['system', 'ai']).optional().default('system') }).strict(), params: z.object({ id: objectId }) });
exports.aiSensitiveLogSchema = z.object({ body: z.object({}).strict(), query: z.object({ reason: z.string().trim().min(10).max(300) }).strict(), params: z.object({ id: objectId }) });
exports.listSchema = z.object({ body: z.object({}).strict(), query: listQuery(), params: z.object({}).strict() });
exports.userListSchema = z.object({ body: z.object({}).strict(), query: listQuery({ role: roleEnum.optional(), isActive: z.coerce.boolean().optional(), is_active: z.coerce.boolean().optional() }), params: z.object({}).strict() });
exports.pharmacyListSchema = z.object({ body: z.object({}).strict(), query: listQuery({ status: statusEnum.optional(), ownerId: objectId.optional(), owner_id: objectId.optional() }), params: z.object({}).strict() });
exports.pharmacyRequestListSchema = z.object({
  body: z.object({}).strict(),
  query: listQuery({
    status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('pending')
  }),
  params: z.object({}).strict()
});
exports.drugListSchema = z.object({ body: z.object({}).strict(), query: listQuery({ category: z.string().max(100).optional(), isActive: z.coerce.boolean().optional(), is_active: z.coerce.boolean().optional() }), params: z.object({}).strict() });
exports.inventoryListSchema = z.object({ body: z.object({}).strict(), query: listQuery({ pharmacyId: objectId.optional(), pharmacy_id: objectId.optional(), drugId: objectId.optional(), drug_id: objectId.optional(), lowStock: z.coerce.number().int().min(0).optional(), low_stock: z.coerce.number().int().min(0).optional() }), params: z.object({}).strict() });
exports.logListSchema = z.object({ body: z.object({}).strict(), query: listQuery({ type: z.enum(['system', 'sync', 'login_attempt', 'ai', 'admin_action', 'error']).optional(), source: z.enum(['system', 'ai']).optional().default('system'), status: z.enum(['started', 'completed', 'failed']).optional(), success: z.coerce.boolean().optional() }), params: z.object({}).strict() });
exports.analyticsSchema = z.object({ body: z.object({}).strict(), query: z.object({ range: z.enum(['today', 'week', 'month', 'custom', 'all']).optional().default('week'), from: z.string().max(40).optional(), to: z.string().max(40).optional() }).strict(), params: z.object({}).strict() });

const userBody = z.object({
  fullName: z.string().min(2).max(100).optional(),
  full_name: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(254).optional(),
  password: passwordSchema.optional(),
  role: roleEnum.optional(),
  pharmacyId: objectId.optional().nullable(),
  pharmacy_id: objectId.optional().nullable(),
  phoneNumber: z.string().max(32).optional(),
  phone_number: z.string().max(32).optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
}).strict();
exports.createUserSchema = z.object({ body: userBody.extend({ email: z.string().email().max(254), password: passwordSchema }).refine((v) => v.fullName || v.full_name || v.name, 'name is required'), query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateUserSchema = z.object({ body: userBody, query: z.object({}).strict(), params: z.object({ id: objectId }) });

const pharmacyBody = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().min(3).max(500).optional(),
  phone: z.string().max(32).optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  status: statusEnum.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  workingHours: z.string().max(200).optional(),
  working_hours: z.string().max(200).optional(),
  ownerId: objectId.optional().nullable(),
  owner_id: objectId.optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional(),
  googleMapsUrl: z.string().url().max(1000).optional().or(z.literal('')),
  google_maps_url: z.string().url().max(1000).optional().or(z.literal(''))
}).strict();
exports.createPharmacySchema = z.object({ body: pharmacyBody.extend({ name: z.string().min(2).max(200), address: z.string().min(3).max(500), latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional() }).refine((v) => (v.latitude !== undefined && v.longitude !== undefined) || (v.lat !== undefined && v.lng !== undefined), 'latitude/longitude or lat/lng are required'), query: z.object({}).strict(), params: z.object({}).strict() });
exports.updatePharmacySchema = z.object({ body: pharmacyBody, query: z.object({}).strict(), params: z.object({ id: objectId }) });

const drugBody = z.object({
  genericName: z.string().min(2).max(120).optional(),
  generic_name: z.string().min(2).max(120).optional(),
  brandNames: arr,
  brand_names: arr,
  aliases: arr,
  category: z.string().min(2).max(100).optional().default('General'),
  dosageForm: z.string().min(1).max(80).optional(),
  dosage_form: z.string().min(1).max(80).optional(),
  strength: z.string().min(1).max(80).optional(),
  description: z.string().max(2000).optional().default(''),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
}).strict();
exports.createDrugSchema = z.object({ body: drugBody.extend({ strength: z.string().min(1).max(80) }).refine((v) => v.genericName || v.generic_name, 'genericName is required').refine((v) => v.dosageForm || v.dosage_form, 'dosageForm is required'), query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateDrugSchema = z.object({ body: drugBody, query: z.object({}).strict(), params: z.object({ id: objectId }) });

exports.createCategorySchema = z.object({ body: z.object({ name: z.string().min(2).max(100), description: z.string().max(1000).optional().default('') }).strict(), query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateCategorySchema = z.object({ body: z.object({ name: z.string().min(2).max(100).optional(), description: z.string().max(1000).optional() }).strict(), query: z.object({}).strict(), params: z.object({ id: objectId }) });

const inventoryItemBase = z.object({
  pharmacyId: objectId.optional(),
  pharmacy_id: objectId.optional(),
  drugId: objectId.optional(),
  drug_id: objectId.optional(),
  quantity: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0).optional().default(0)
}).strict();
const inventoryItem = inventoryItemBase.refine((v) => v.drugId || v.drug_id, 'drugId is required');
exports.createInventorySchema = z.object({ body: inventoryItem.refine((v) => v.pharmacyId || v.pharmacy_id, 'pharmacyId is required'), query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateInventorySchema = z.object({ body: inventoryItemBase.partial().strict().refine((v) => !v.drugId && !v.drug_id ? true : true), query: z.object({}).strict(), params: z.object({ id: objectId }) });
exports.syncInventorySchema = z.object({ body: z.object({ pharmacyId: objectId.optional(), pharmacy_id: objectId.optional(), inventory: z.array(inventoryItemBase.omit({ pharmacyId: true, pharmacy_id: true }).refine((v) => v.drugId || v.drug_id, 'drugId is required')).min(1).max(1000) }).strict().refine((v) => v.pharmacyId || v.pharmacy_id, 'pharmacyId is required'), query: z.object({}).strict(), params: z.object({}).strict() });

function meta(p, total) { return { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) }; }
function rx(value) { return new RegExp(escapeRegex(value), 'i'); }
function id(value) { return value ? String(value._id || value.id || value) : null; }
function userDto(user) { return { id: id(user), name: user.fullName, fullName: user.fullName, email: user.email, role: user.role, phoneNumber: user.phoneNumber || '', phone_number: user.phoneNumber || '', pharmacyId: user.pharmacyId || null, pharmacy_id: user.pharmacyId || null, isActive: user.isActive, is_active: user.isActive, lastLoginAt: user.lastLoginAt, last_login_at: user.lastLoginAt, createdAt: user.createdAt, created_at: user.createdAt, updatedAt: user.updatedAt, updated_at: user.updatedAt, mfaEnabled: user.mfaEnabled === true, mfa_enabled: user.mfaEnabled === true, mfaPolicyVersion: Number(user.mfaPolicyVersion || 1), mfa_policy_version: Number(user.mfaPolicyVersion || 1), mfaGrandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true, mfa_grandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true, passwordPolicyVersion: Number(user.passwordPolicyVersion || 1), password_policy_version: Number(user.passwordPolicyVersion || 1), passwordUpgradeRecommended: Number(user.passwordPolicyVersion || 1) < 2, password_upgrade_recommended: Number(user.passwordPolicyVersion || 1) < 2 }; }
function pharmacyDto(p, extra = {}) { return { id: id(p), name: p.name, address: p.address, phone: p.phone || '', email: p.email || '', status: p.status, latitude: p.latitude, longitude: p.longitude, location: p.location, workingHours: p.workingHours || '', working_hours: p.workingHours || '', googleMapsUrl: p.googleMapsUrl || '', google_maps_url: p.googleMapsUrl || '', ownerId: p.ownerId || null, owner_id: p.ownerId || null, rating: p.rating || 0, createdAt: p.createdAt, created_at: p.createdAt, updatedAt: p.updatedAt, updated_at: p.updatedAt, ...extra }; }
function pharmacyRequestDto(p) {
  const owner = p.ownerId && typeof p.ownerId === 'object' ? p.ownerId : null;
  return pharmacyDto(p, {
    pharmacyName: p.name,
    pharmacy_name: p.name,
    ownerId: owner ? id(owner) : (p.ownerId || null),
    owner_id: owner ? id(owner) : (p.ownerId || null),
    ownerName: owner?.fullName || '',
    owner_name: owner?.fullName || '',
    ownerEmail: owner?.email || '',
    owner_email: owner?.email || '',
    ownerPhone: owner?.phoneNumber || '',
    owner_phone: owner?.phoneNumber || ''
  });
}
function drugDto(d) { return { id: id(d), genericName: d.genericName, generic_name: d.genericName, name: d.genericName, brandNames: d.brandNames || [], brand_names: d.brandNames || [], aliases: d.aliases || [], category: d.category, dosageForm: d.dosageForm, dosage_form: d.dosageForm, form: d.dosageForm, strength: d.strength, description: d.description || '', isActive: d.isActive !== false, is_active: d.isActive !== false, createdAt: d.createdAt, created_at: d.createdAt, updatedAt: d.updatedAt, updated_at: d.updatedAt }; }
function categoryDto(c) { return { id: id(c), name: c.name, description: c.description || '', createdAt: c.createdAt, created_at: c.createdAt, updatedAt: c.updatedAt, updated_at: c.updatedAt }; }
function inventoryDto(item) { return { id: id(item), pharmacyId: id(item.pharmacyId), pharmacy_id: id(item.pharmacyId), drugId: id(item.drugId), drug_id: id(item.drugId), quantity: item.quantity, price: item.price || 0, source: item.source || 'pos_snapshot', updatedAt: item.updatedAt, updated_at: item.updatedAt, createdAt: item.createdAt, created_at: item.createdAt, pharmacy: item.pharmacyId && item.pharmacyId.name ? pharmacyDto(item.pharmacyId) : null, drug: item.drugId && item.drugId.genericName ? drugDto(item.drugId) : null }; }
function logDto(log) { const isAi = Boolean(log.provider || log.redactedPreview !== undefined || log.drugCount !== undefined); return { id: id(log), type: log.type || log.status || 'ai', action: log.action || '', actorId: log.actorId || log.userId || null, actor_id: log.actorId || log.userId || null, actorRole: log.actorRole || '', actor_role: log.actorRole || '', success: log.success, message: log.message || log.errorMessage || '', metadata: log.metadata || {}, ...(isAi ? { redacted_preview: log.redactedPreview || '', drug_count: Number(log.drugCount || 0), consent_to_store: log.consentToStore === true, sensitive_data_available: log.hasSensitivePayload === true, confidence: log.confidence, status: log.status, provider: log.provider, expires_at: log.expiresAt } : {}), createdAt: log.createdAt, created_at: log.createdAt, updatedAt: log.updatedAt, updated_at: log.updatedAt }; }

function cleanUserPayload(body, isCreate = false) {
  const out = {};
  if (body.fullName || body.full_name || body.name) out.fullName = body.fullName || body.full_name || body.name;
  if (body.email) out.email = body.email.trim().toLowerCase();
  if (body.role) out.role = body.role;
  if (body.phoneNumber !== undefined || body.phone_number !== undefined) out.phoneNumber = body.phoneNumber ?? body.phone_number ?? '';
  if (body.pharmacyId !== undefined || body.pharmacy_id !== undefined) out.pharmacyId = body.pharmacyId ?? body.pharmacy_id ?? null;
  if (body.isActive !== undefined || body.is_active !== undefined) out.isActive = body.isActive ?? body.is_active;
  if (isCreate && out.isActive === undefined) out.isActive = true;
  return out;
}
function cleanPharmacyPayload(body) {
  const out = {};
  for (const key of ['name', 'address', 'phone', 'email', 'status', 'rating']) if (body[key] !== undefined) out[key] = body[key];
  if (body.workingHours !== undefined || body.working_hours !== undefined) out.workingHours = body.workingHours ?? body.working_hours ?? '';
  if (body.ownerId !== undefined || body.owner_id !== undefined) out.ownerId = body.ownerId ?? body.owner_id ?? null;
  if (body.googleMapsUrl !== undefined || body.google_maps_url !== undefined) out.googleMapsUrl = body.googleMapsUrl ?? body.google_maps_url ?? '';
  const latitude = body.latitude ?? body.lat;
  const longitude = body.longitude ?? body.lng;
  if (latitude !== undefined) out.latitude = Number(latitude);
  if (longitude !== undefined) out.longitude = Number(longitude);
  return out;
}
async function ensureCategory(name) { if (!name) return null; return Category.findOneAndUpdate({ name }, { $setOnInsert: { description: '' } }, { upsert: true, new: true }); }
function cleanDrugPayload(body) {
  const out = {};
  const genericName = body.genericName || body.generic_name;
  const dosageForm = body.dosageForm || body.dosage_form;
  const isActive = body.isActive ?? body.is_active;
  if (genericName !== undefined) out.genericName = genericName;
  if (body.brandNames !== undefined || body.brand_names !== undefined) out.brandNames = body.brandNames || body.brand_names || [];
  if (body.aliases !== undefined) out.aliases = body.aliases || [];
  if (body.category !== undefined) out.category = body.category || 'General';
  if (dosageForm !== undefined) out.dosageForm = dosageForm;
  if (body.strength !== undefined) out.strength = body.strength;
  if (body.description !== undefined) out.description = body.description || '';
  if (isActive !== undefined) out.isActive = isActive;
  return out;
}
async function requireDoc(model, docId, name) { validateObjectId(docId); const doc = await model.findById(docId); if (!doc) throw new AppError(`${name} not found`, 404); return doc; }

exports.dashboardLogin = asyncHandler(async (req, res) => {
  const result = await beginLogin(req.validated.body.email, req.validated.body.password, req);
  if (result.user.role !== 'admin') {
    if (result.tokens?.session) await revokeSession(result.tokens.session._id, 'non_admin_dashboard_login');
    throw new AppError('Invalid admin credentials', 401);
  }
  await systemLog({ type: 'login_attempt', action: 'dashboard.login', actorId: result.user._id, actorRole: result.user.role, success: true, message: result.mfa ? 'Password verified; MFA required' : 'Dashboard login successful', ip: req.ip });
  if (result.mfa) return success(res, { user: userDto(result.user), ...result.mfa }, 'MFA verification required');
  setSessionCookies(res, result.tokens);
  return success(res, { user: userDto(result.user), token_type: 'Cookie', expires_in: result.tokens.expires_in, refresh_expires_in: result.tokens.refresh_expires_in }, 'Dashboard login successful');
});
exports.dashboardMe = asyncHandler(async (req, res) => success(res, userDto(req.authUser), 'Dashboard profile loaded'));

exports.users = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query); const filter = {};
  if (req.validated.query.q) filter.$or = [{ fullName: rx(req.validated.query.q) }, { email: rx(req.validated.query.q) }, { phoneNumber: rx(req.validated.query.q) }];
  if (req.validated.query.role) filter.role = req.validated.query.role;
  const active = req.validated.query.isActive ?? req.validated.query.is_active;
  if (active !== undefined) filter.isActive = active;
  const [rows, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(), User.countDocuments(filter)]);
  return success(res, { data: rows.map(userDto), pagination: meta(p, total) }, 'Users loaded');
});
exports.getUser = asyncHandler(async (req, res) => success(res, userDto(await requireDoc(User, req.validated.params.id, 'User')), 'User loaded'));
exports.createUser = asyncHandler(async (req, res) => {
  const data = cleanUserPayload(req.validated.body, true);
  const exists = await User.findOne({ email: data.email }); if (exists) throw new AppError('Email already exists', 409);
  data.passwordHash = await hashPassword(req.validated.body.password, { email: data.email, fullName: data.fullName });
  data.passwordPolicyVersion = 2;
  data.mfaPolicyVersion = data.role === 'admin' ? 2 : 1;
  const user = await User.create(data);
  await systemLog({ type: 'admin_action', action: 'admin.users.create', actorId: req.authUser._id, actorRole: req.authRole, message: 'User created', metadata: { userId: user._id } });
  return success(res, userDto(user), 'User created', 201);
});
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await requireDoc(User, req.validated.params.id, 'User');
  const data = cleanUserPayload(req.validated.body);
  if (data.email && data.email !== user.email) { const exists = await User.findOne({ email: data.email, _id: { $ne: user._id } }); if (exists) throw new AppError('Email already exists', 409); }
  const promotedToAdmin = data.role === 'admin' && user.role !== 'admin';
  const securityChanged = Boolean(req.validated.body.password) || (data.isActive === false && user.isActive !== false) || (data.role && data.role !== user.role);
  Object.assign(user, data);
  if (promotedToAdmin) {
    user.mfaPolicyVersion = 2;
    user.mfaEnabled = false;
    user.mfaSecretEncrypted = '';
    user.mfaRecoveryCodeHashes = [];
    user.mfaEnrolledAt = null;
  }
  if (req.validated.body.password) { user.passwordHash = await hashPassword(req.validated.body.password, { email: data.email || user.email, fullName: data.fullName || user.fullName }); user.passwordPolicyVersion = 2; user.passwordChangedAt = new Date(); }
  await user.save();
  if (securityChanged) await invalidateUserSessions(user._id, 'admin_security_change', { incrementVersion: true });
  await systemLog({ type: 'admin_action', action: 'admin.users.update', actorId: req.authUser._id, actorRole: req.authRole, message: 'User updated', metadata: { userId: user._id } });
  return success(res, userDto(user), 'User updated');
});
exports.deleteUser = asyncHandler(async (req, res) => { const deleted = await User.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('User not found', 404); await systemLog({ type: 'admin_action', action: 'admin.users.delete', actorId: req.authUser._id, actorRole: req.authRole, message: 'User deleted', metadata: { userId: deleted._id } }); return success(res, { deleted: true }, 'User deleted'); });

exports.pharmacies = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query);
  const q = req.validated.query;
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.ownerId || q.owner_id) filter.ownerId = q.ownerId || q.owner_id;
  if (q.q) { const pattern = rx(q.q); filter.$or = [{ name: pattern }, { address: pattern }, { phone: pattern }, { email: pattern }]; }
  const [rows, total] = await Promise.all([
    Pharmacy.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Pharmacy.countDocuments(filter)
  ]);
  const ids = rows.map((row) => row._id);
  const counts = ids.length ? await InventorySnapshot.aggregate([
    { $match: { pharmacyId: { $in: ids } } },
    { $group: { _id: '$pharmacyId', count: { $sum: 1 }, quantity: { $sum: '$quantity' } } }
  ]) : [];
  const countMap = new Map(counts.map((row) => [String(row._id), row]));
  const data = rows.map((row) => {
    const stats = countMap.get(String(row._id)) || { count: 0, quantity: 0 };
    return pharmacyDto(row, { inventoryCount: stats.count, inventory_count: stats.count, inventoryQuantity: stats.quantity, inventory_quantity: stats.quantity });
  });
  return success(res, { data, pagination: meta(p, total) }, 'Pharmacies loaded');
});

exports.getPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await requireDoc(Pharmacy, req.validated.params.id, 'Pharmacy');
  const inventory = await InventorySnapshot.find({ pharmacyId: pharmacy._id }).populate('drugId').sort({ updatedAt: -1 }).lean();
  const rows = inventory.map(inventoryDto);
  const lowStockThreshold = 10;
  return success(res, {
    pharmacy: pharmacyDto(pharmacy, { inventoryCount: rows.length, inventory_count: rows.length }),
    inventory: rows,
    stats: {
      total_inventory_items: rows.length,
      total_quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      low_stock_count: rows.filter((row) => Number(row.quantity || 0) > 0 && Number(row.quantity || 0) < lowStockThreshold).length,
      out_of_stock_count: rows.filter((row) => Number(row.quantity || 0) <= 0).length
    }
  }, 'Pharmacy loaded');
});
exports.createPharmacy = asyncHandler(async (req, res) => { const pharmacy = await Pharmacy.create({ status: 'active', ...cleanPharmacyPayload(req.validated.body) }); await systemLog({ type: 'admin_action', action: 'admin.pharmacies.create', actorId: req.authUser._id, actorRole: req.authRole, message: 'Pharmacy created', metadata: { pharmacyId: pharmacy._id } }); return success(res, pharmacyDto(pharmacy), 'Pharmacy created', 201); });
exports.updatePharmacy = asyncHandler(async (req, res) => { const pharmacy = await requireDoc(Pharmacy, req.validated.params.id, 'Pharmacy'); Object.assign(pharmacy, cleanPharmacyPayload(req.validated.body)); await pharmacy.save(); await systemLog({ type: 'admin_action', action: 'admin.pharmacies.update', actorId: req.authUser._id, actorRole: req.authRole, message: 'Pharmacy updated', metadata: { pharmacyId: pharmacy._id } }); return success(res, pharmacyDto(pharmacy), 'Pharmacy updated'); });
exports.deletePharmacy = asyncHandler(async (req, res) => { const deleted = await Pharmacy.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Pharmacy not found', 404); await InventorySnapshot.deleteMany({ pharmacyId: deleted._id }); await systemLog({ type: 'admin_action', action: 'admin.pharmacies.delete', actorId: req.authUser._id, actorRole: req.authRole, message: 'Pharmacy deleted', metadata: { pharmacyId: deleted._id } }); return success(res, { deleted: true }, 'Pharmacy deleted'); });

exports.pharmacyRequests = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query);
  const status = req.validated.query.status || 'pending';
  const requestStatuses = ['pending', 'approved', 'rejected'];
  const filter = status === 'all' ? { status: { $in: requestStatuses } } : { status };
  if (req.validated.query.q) {
    const pattern = rx(req.validated.query.q);
    filter.$or = [{ name: pattern }, { address: pattern }, { phone: pattern }, { email: pattern }];
  }

  const [rows, total, counts] = await Promise.all([
    Pharmacy.find(filter)
      .populate('ownerId', 'fullName email phoneNumber role pharmacyId')
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .lean(),
    Pharmacy.countDocuments(filter),
    Pharmacy.aggregate([
      { $match: { status: { $in: requestStatuses } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const statusCounts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of counts) statusCounts[row._id] = row.count;

  return success(res, {
    data: rows.map(pharmacyRequestDto),
    counts: statusCounts,
    pagination: meta(p, total)
  }, 'Pharmacy requests loaded');
});

exports.approvePharmacyRequest = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.validated.params.id).populate('ownerId');
  if (!pharmacy) throw new AppError('Pharmacy request not found', 404);
  pharmacy.status = 'approved';
  await pharmacy.save();

  if (pharmacy.ownerId) {
    const ownerUserId = pharmacy.ownerId._id || pharmacy.ownerId;
    await User.findByIdAndUpdate(ownerUserId, { $set: { role: 'pharmacist', pharmacyId: pharmacy._id } });
    await invalidateUserSessions(ownerUserId, 'role_or_tenant_changed', { incrementVersion: true });
    await Notification.create({
      type: 'system',
      title: 'Pharmacy request approved',
      message: `${pharmacy.name} has been approved.`,
      audience: 'pharmacist',
      recipientUserId: pharmacy.ownerId._id || pharmacy.ownerId,
      recipientPharmacyId: pharmacy._id,
      createdBy: req.authUser._id,
      metadata: { kind: 'pharmacy_request', status: 'approved', pharmacyId: String(pharmacy._id), pharmacyName: pharmacy.name }
    });
  }

  await systemLog({ type: 'admin_action', action: 'admin.pharmacyRequests.approve', actorId: req.authUser._id, actorRole: req.authRole, message: 'Pharmacy request approved', metadata: { pharmacyId: pharmacy._id } });
  return success(res, pharmacyRequestDto(pharmacy.toObject()), 'Pharmacy request approved');
});

exports.rejectPharmacyRequest = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.validated.params.id).populate('ownerId');
  if (!pharmacy) throw new AppError('Pharmacy request not found', 404);
  pharmacy.status = 'rejected';
  await pharmacy.save();

  if (pharmacy.ownerId) {
    const ownerUserId = pharmacy.ownerId._id || pharmacy.ownerId;
    await User.findByIdAndUpdate(ownerUserId, { $set: { pharmacyId: null } });
    await invalidateUserSessions(ownerUserId, 'tenant_changed', { incrementVersion: true });
    await Notification.create({
      type: 'system',
      title: 'Pharmacy request rejected',
      message: `${pharmacy.name} has been rejected.`,
      audience: 'pharmacist',
      recipientUserId: pharmacy.ownerId._id || pharmacy.ownerId,
      recipientPharmacyId: pharmacy._id,
      createdBy: req.authUser._id,
      metadata: { kind: 'pharmacy_request', status: 'rejected', pharmacyId: String(pharmacy._id), pharmacyName: pharmacy.name }
    });
  }

  await systemLog({ type: 'admin_action', action: 'admin.pharmacyRequests.reject', actorId: req.authUser._id, actorRole: req.authRole, message: 'Pharmacy request rejected', metadata: { pharmacyId: pharmacy._id } });
  return success(res, pharmacyRequestDto(pharmacy.toObject()), 'Pharmacy request rejected');
});

exports.drugs = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query); const filter = {};
  if (req.validated.query.q) filter.$or = [{ genericName: rx(req.validated.query.q) }, { brandNames: rx(req.validated.query.q) }, { aliases: rx(req.validated.query.q) }, { searchText: rx(req.validated.query.q) }];
  if (req.validated.query.category) filter.category = rx(req.validated.query.category);
  const active = req.validated.query.isActive ?? req.validated.query.is_active;
  if (active !== undefined) filter.isActive = active;
  const [rows, total] = await Promise.all([Drug.find(filter).sort({ genericName: 1 }).skip(p.skip).limit(p.limit).lean(), Drug.countDocuments(filter)]);
  return success(res, { data: rows.map(drugDto), pagination: meta(p, total) }, 'Drugs loaded');
});
exports.getDrug = asyncHandler(async (req, res) => success(res, drugDto(await requireDoc(Drug, req.validated.params.id, 'Drug')), 'Drug loaded'));
exports.createDrug = asyncHandler(async (req, res) => { const data = cleanDrugPayload(req.validated.body); await ensureCategory(data.category); const drug = await Drug.create(data); await systemLog({ type: 'admin_action', action: 'admin.drugs.create', actorId: req.authUser._id, actorRole: req.authRole, message: 'Drug created', metadata: { drugId: drug._id } }); return success(res, drugDto(drug), 'Drug created', 201); });
exports.updateDrug = asyncHandler(async (req, res) => { const drug = await requireDoc(Drug, req.validated.params.id, 'Drug'); Object.assign(drug, cleanDrugPayload(req.validated.body)); await ensureCategory(drug.category); await drug.save(); await systemLog({ type: 'admin_action', action: 'admin.drugs.update', actorId: req.authUser._id, actorRole: req.authRole, message: 'Drug updated', metadata: { drugId: drug._id } }); return success(res, drugDto(drug), 'Drug updated'); });
exports.deleteDrug = asyncHandler(async (req, res) => { const deleted = await Drug.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Drug not found', 404); await InventorySnapshot.deleteMany({ drugId: deleted._id }); await systemLog({ type: 'admin_action', action: 'admin.drugs.delete', actorId: req.authUser._id, actorRole: req.authRole, message: 'Drug deleted', metadata: { drugId: deleted._id } }); return success(res, { deleted: true }, 'Drug deleted'); });

exports.categories = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const filter = req.validated.query.q ? { name: rx(req.validated.query.q) } : {}; const [rows, total] = await Promise.all([Category.find(filter).sort({ name: 1 }).skip(p.skip).limit(p.limit).lean(), Category.countDocuments(filter)]); return success(res, { data: rows.map(categoryDto), pagination: meta(p, total) }, 'Categories loaded'); });
exports.getCategory = asyncHandler(async (req, res) => success(res, categoryDto(await requireDoc(Category, req.validated.params.id, 'Category')), 'Category loaded'));
exports.createCategory = asyncHandler(async (req, res) => { const category = await Category.create(req.validated.body); await systemLog({ type: 'admin_action', action: 'admin.categories.create', actorId: req.authUser._id, actorRole: req.authRole, message: 'Category created', metadata: { categoryId: category._id } }); return success(res, categoryDto(category), 'Category created', 201); });
exports.updateCategory = asyncHandler(async (req, res) => { const category = await requireDoc(Category, req.validated.params.id, 'Category'); Object.assign(category, req.validated.body); await category.save(); await systemLog({ type: 'admin_action', action: 'admin.categories.update', actorId: req.authUser._id, actorRole: req.authRole, message: 'Category updated', metadata: { categoryId: category._id } }); return success(res, categoryDto(category), 'Category updated'); });
exports.deleteCategory = asyncHandler(async (req, res) => { const deleted = await Category.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Category not found', 404); await systemLog({ type: 'admin_action', action: 'admin.categories.delete', actorId: req.authUser._id, actorRole: req.authRole, message: 'Category deleted', metadata: { categoryId: deleted._id } }); return success(res, { deleted: true }, 'Category deleted'); });

exports.inventory = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query); const filter = {};
  if (req.validated.query.pharmacyId || req.validated.query.pharmacy_id) filter.pharmacyId = req.validated.query.pharmacyId || req.validated.query.pharmacy_id;
  if (req.validated.query.drugId || req.validated.query.drug_id) filter.drugId = req.validated.query.drugId || req.validated.query.drug_id;
  const low = req.validated.query.lowStock ?? req.validated.query.low_stock;
  if (low !== undefined) filter.quantity = { $lte: low };
  const [rows, total] = await Promise.all([InventorySnapshot.find(filter).populate('pharmacyId').populate('drugId').sort({ updatedAt: -1 }).skip(p.skip).limit(p.limit).lean(), InventorySnapshot.countDocuments(filter)]);
  let data = rows.map(inventoryDto);
  if (req.validated.query.q) { const q = String(req.validated.query.q).toLowerCase(); data = data.filter((x) => (x.pharmacy?.name || '').toLowerCase().includes(q) || (x.drug?.name || '').toLowerCase().includes(q)); }
  return success(res, { data, pagination: meta(p, total) }, 'Inventory loaded');
});
exports.getInventoryItem = asyncHandler(async (req, res) => { const item = await InventorySnapshot.findById(req.validated.params.id).populate('pharmacyId').populate('drugId').lean(); if (!item) throw new AppError('Inventory item not found', 404); return success(res, inventoryDto(item), 'Inventory item loaded'); });
exports.createInventoryItem = asyncHandler(async (req, res) => { const pharmacyId = req.validated.body.pharmacyId || req.validated.body.pharmacy_id; const drugId = req.validated.body.drugId || req.validated.body.drug_id; await requireDoc(Pharmacy, pharmacyId, 'Pharmacy'); await requireDoc(Drug, drugId, 'Drug'); const item = await InventorySnapshot.findOneAndUpdate({ pharmacyId, drugId }, { $set: { quantity: req.validated.body.quantity, price: req.validated.body.price || 0, updatedAt: new Date(), source: 'dashboard' }, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true }).populate('pharmacyId').populate('drugId'); await systemLog({ type: 'admin_action', action: 'admin.inventory.upsert', actorId: req.authUser._id, actorRole: req.authRole, message: 'Inventory item upserted', metadata: { pharmacyId, drugId } }); return success(res, inventoryDto(item), 'Inventory item saved', 201); });
exports.updateInventoryItem = asyncHandler(async (req, res) => {
  let item = await requireDoc(InventorySnapshot, req.validated.params.id, 'Inventory item');
  const targetPharmacyId = req.validated.body.pharmacyId || req.validated.body.pharmacy_id || item.pharmacyId;
  const targetDrugId = req.validated.body.drugId || req.validated.body.drug_id || item.drugId;
  await requireDoc(Pharmacy, targetPharmacyId, 'Pharmacy');
  await requireDoc(Drug, targetDrugId, 'Drug');

  const duplicate = await InventorySnapshot.findOne({
    _id: { $ne: item._id },
    pharmacyId: targetPharmacyId,
    drugId: targetDrugId
  });

  if (duplicate) {
    const movedQuantity = req.validated.body.quantity !== undefined ? req.validated.body.quantity : item.quantity;
    duplicate.quantity = Number(duplicate.quantity || 0) + Number(movedQuantity || 0);
    duplicate.price = req.validated.body.price !== undefined ? req.validated.body.price : (item.price || duplicate.price);
    duplicate.source = 'dashboard_move_merge';
    duplicate.updatedAt = new Date();
    await duplicate.save();
    await item.deleteOne();
    item = duplicate;
  } else {
    item.pharmacyId = targetPharmacyId;
    item.drugId = targetDrugId;
    if (req.validated.body.quantity !== undefined) item.quantity = req.validated.body.quantity;
    if (req.validated.body.price !== undefined) item.price = req.validated.body.price;
    item.updatedAt = new Date();
    item.source = 'dashboard';
    await item.save();
  }

  await item.populate('pharmacyId');
  await item.populate('drugId');
  await systemLog({ type: 'admin_action', action: 'admin.inventory.update', actorId: req.authUser._id, actorRole: req.authRole, message: 'Inventory item updated', metadata: { inventoryId: item._id, pharmacyId: targetPharmacyId, drugId: targetDrugId } });
  return success(res, inventoryDto(item), 'Inventory item updated');
});

exports.deleteInventoryItem = asyncHandler(async (req, res) => { const deleted = await InventorySnapshot.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Inventory item not found', 404); await systemLog({ type: 'admin_action', action: 'admin.inventory.delete', actorId: req.authUser._id, actorRole: req.authRole, message: 'Inventory item deleted', metadata: { inventoryId: deleted._id } }); return success(res, { deleted: true }, 'Inventory item deleted'); });
exports.syncInventory = asyncHandler(async (req, res) => { const pharmacyId = req.validated.body.pharmacyId || req.validated.body.pharmacy_id; await requireDoc(Pharmacy, pharmacyId, 'Pharmacy'); const drugIds = req.validated.body.inventory.map((item) => item.drugId || item.drug_id); const found = await Drug.find({ _id: { $in: drugIds } }).select('_id').lean(); const foundSet = new Set(found.map((d) => String(d._id))); const missing = drugIds.filter((x) => !foundSet.has(String(x))); if (missing.length) throw new AppError('Some drugs were not found', 404, { missing_drug_ids: missing }); const now = new Date(); const ops = req.validated.body.inventory.map((item) => ({ updateOne: { filter: { pharmacyId: new mongoose.Types.ObjectId(pharmacyId), drugId: new mongoose.Types.ObjectId(item.drugId || item.drug_id) }, update: { $set: { quantity: item.quantity, price: item.price || 0, updatedAt: now, source: 'dashboard_sync' }, $setOnInsert: { createdAt: now } }, upsert: true } })); const result = await InventorySnapshot.bulkWrite(ops, { ordered: false }); await systemLog({ type: 'sync', action: 'admin.inventory.sync', actorId: req.authUser._id, actorRole: req.authRole, message: 'Dashboard inventory synced', metadata: { pharmacyId, items: req.validated.body.inventory.length } }); return success(res, { pharmacy_id: pharmacyId, synced_items: req.validated.body.inventory.length, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount, updated_at: now }, 'Inventory synced'); });

async function listLogs(req, res, forcedSource = null) {
  const p = pagination(req.validated.query);
  const source = forcedSource || req.validated.query.source;
  const isAi = source === 'ai' || req.validated.query.type === 'ai';
  const model = isAi ? AiLog : SystemLog;
  const filter = {};
  if (isAi && req.validated.query.status) filter.status = req.validated.query.status;
  if (!isAi && req.validated.query.type) filter.type = req.validated.query.type;
  if (!isAi && req.validated.query.success !== undefined) filter.success = req.validated.query.success;
  if (req.validated.query.q) {
    filter.$or = isAi
      ? [{ redactedPreview: rx(req.validated.query.q) }, { errorMessage: rx(req.validated.query.q) }]
      : [{ action: rx(req.validated.query.q) }, { message: rx(req.validated.query.q) }];
  }
  const [rows, total] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    model.countDocuments(filter)
  ]);
  return success(res, { data: rows.map(logDto), pagination: meta(p, total) }, isAi ? 'AI logs loaded' : 'System logs loaded');
}

exports.logs = asyncHandler(async (req, res) => listLogs(req, res));
exports.aiLogs = asyncHandler(async (req, res) => listLogs(req, res, 'ai'));
exports.getSensitiveAiLog = asyncHandler(async (req, res) => {
  const log = await AiLog.findById(req.validated.params.id).select('+sensitivePayloadEncrypted +extractedText +extractedDrugs');
  if (!log) throw new AppError('AI log not found', 404);
  if (!log.sensitivePayloadEncrypted) throw new AppError('Sensitive data was not retained for this scan', 404);
  const payload = decryptJson(log.sensitivePayloadEncrypted);
  log.sensitiveAccessCount = Number(log.sensitiveAccessCount || 0) + 1;
  await log.save();
  await systemLog({ type: 'admin_action', action: 'admin.ai_logs.sensitive_access', actorId: req.authUser._id, actorRole: req.authRole, message: 'Sensitive AI log accessed', metadata: { aiLogId: log._id, reason: req.validated.query.reason }, ip: req.ip });
  return success(res, { id: String(log._id), extracted_text: payload.extractedText || '', extracted_drugs: payload.extractedDrugs || [], reason: req.validated.query.reason }, 'Sensitive AI log loaded');
});
exports.systemLogs = asyncHandler(async (req, res) => listLogs(req, res, 'system'));
exports.getLog = asyncHandler(async (req, res) => {
  const source = req.validated.query.source === 'ai' ? 'ai' : 'system';
  const model = source === 'ai' ? AiLog : SystemLog;
  const log = await model.findById(req.validated.params.id).lean();
  if (!log) throw new AppError('Log not found', 404);
  return success(res, logDto(log), 'Log loaded');
});
exports.deleteLog = asyncHandler(async (req, res) => {
  const source = req.validated.query.source === 'ai' ? 'ai' : 'system';
  const model = source === 'ai' ? AiLog : SystemLog;
  const deleted = await model.findByIdAndDelete(req.validated.params.id);
  if (!deleted) throw new AppError('Log not found', 404);
  return success(res, { deleted: true }, 'Log deleted');
});

function analyticsDateFilter(query = {}) {
  const now = new Date();
  const range = query.range || 'week';
  let from = query.from ? new Date(`${String(query.from).slice(0, 10)}T00:00:00.000Z`) : null;
  let to = query.to ? new Date(`${String(query.to).slice(0, 10)}T23:59:59.999Z`) : now;
  if (range === 'today') from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === 'week') { from = new Date(now); from.setUTCDate(from.getUTCDate() - 6); from.setUTCHours(0, 0, 0, 0); }
  if (range === 'month') { from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); }
  if (range === 'all') return {};
  if (range === 'custom' && !from && !query.to) return {};
  const filter = {};
  if (from) filter.$gte = from;
  if (to) filter.$lte = to;
  return Object.keys(filter).length ? filter : {};
}

exports.analytics = asyncHandler(async (req, res) => {
  const dateBounds = analyticsDateFilter(req.validated?.query || req.query || {});
  const inventoryFilter = Object.keys(dateBounds).length ? { updatedAt: dateBounds } : {};
  const logFilter = Object.keys(dateBounds).length ? { createdAt: dateBounds } : {};
  const pharmacyFilter = Object.keys(dateBounds).length ? { createdAt: dateBounds } : {};

  const [users, admins, pharmacists, patients, pharmacies, activePharmacies, drugs, categories, inventoryRows, aiLogs, failedAiLogs, syncLogs, loginAttempts, recentLogs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'pharmacist' }),
    User.countDocuments({ role: 'patient' }),
    Pharmacy.countDocuments(pharmacyFilter),
    Pharmacy.countDocuments({ ...pharmacyFilter, status: { $in: ['active', 'approved'] } }),
    Drug.countDocuments({ isActive: { $ne: false } }),
    Category.countDocuments(),
    InventorySnapshot.find(inventoryFilter).populate('pharmacyId').populate('drugId').lean(),
    AiLog.countDocuments(Object.keys(dateBounds).length ? { createdAt: dateBounds } : {}),
    AiLog.countDocuments({ ...(Object.keys(dateBounds).length ? { createdAt: dateBounds } : {}), status: 'failed' }),
    SystemLog.countDocuments({ ...logFilter, type: 'sync' }),
    SystemLog.countDocuments({ ...logFilter, type: 'login_attempt' }),
    SystemLog.find(logFilter).sort({ createdAt: -1 }).limit(10).lean()
  ]);

  const totalStock = inventoryRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const lowStockItems = inventoryRows.filter((row) => Number(row.quantity || 0) > 0 && Number(row.quantity || 0) < 10).length;
  const outOfStockItems = inventoryRows.filter((row) => Number(row.quantity || 0) <= 0).length;
  const availableInventory = inventoryRows.filter((row) => Number(row.quantity || 0) > 0).length;
  const byCategoryMap = new Map();
  const byPharmacyMap = new Map();
  for (const row of inventoryRows) {
    const category = row.drugId?.category || 'General';
    byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + Number(row.quantity || 0));
    const pharmacyId = String(row.pharmacyId?._id || row.pharmacyId || '');
    const pharmacyName = row.pharmacyId?.name || 'Unknown pharmacy';
    const current = byPharmacyMap.get(pharmacyId) || { id: pharmacyId, name: pharmacyName, quantity: 0, items: 0 };
    current.quantity += Number(row.quantity || 0);
    current.items += 1;
    byPharmacyMap.set(pharmacyId, current);
  }

  return success(res, {
    period: { range: req.validated?.query?.range || 'week', from: dateBounds.$gte || null, to: dateBounds.$lte || null },
    users, admins, pharmacists, patients, pharmacies,
    active_pharmacies: activePharmacies,
    drugs, categories,
    inventory_items: inventoryRows.length,
    available_inventory_items: availableInventory,
    total_stock: totalStock,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
    stock_by_category: Array.from(byCategoryMap, ([label, value]) => ({ label, value })),
    stock_status: [
      { key: 'in_stock', value: inventoryRows.length - lowStockItems - outOfStockItems },
      { key: 'low_stock', value: lowStockItems },
      { key: 'out_of_stock', value: outOfStockItems }
    ],
    top_pharmacies: Array.from(byPharmacyMap.values()).sort((a, b) => b.quantity - a.quantity),
    ai_logs: aiLogs,
    failed_ai_logs: failedAiLogs,
    sync_logs: syncLogs,
    login_attempts: loginAttempts,
    recent_logs: recentLogs.map(logDto)
  }, 'Analytics loaded');
});

exports.settings = asyncHandler(async (_req, res) => success(res, { node_env: env.nodeEnv, port: env.port, gemini_model: env.geminiModel, cors_origins: env.corsOrigins, upload_dir: env.uploadDir, max_file_size_mb: env.maxFileSizeMb }, 'Dashboard settings loaded'));
