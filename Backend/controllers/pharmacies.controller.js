const { z } = require('zod');
const { Pharmacy, Notification } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, validateObjectId, isValidObjectId, pagination, escapeRegex } = require('../utils/helpers');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const statusEnum = z.enum(['pending', 'approved', 'active', 'inactive', 'rejected']);

const commonCreateFields = {
  name: z.string().min(2).max(200),
  address: z.string().min(3).max(500),
  phone: z.string().max(32).optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  workingHours: z.string().max(200).optional(),
  working_hours: z.string().max(200).optional(),
  googleMapsUrl: z.string().url().max(1000).optional().or(z.literal('')),
  google_maps_url: z.string().url().max(1000).optional().or(z.literal(''))
};

const commonUpdateFields = {
  name: z.string().min(2).max(200).optional(),
  address: z.string().min(3).max(500).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional().or(z.literal('')),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  workingHours: z.string().max(200).optional(),
  working_hours: z.string().max(200).optional(),
  googleMapsUrl: z.string().url().max(1000).optional().or(z.literal('')),
  google_maps_url: z.string().url().max(1000).optional().or(z.literal(''))
};

exports.listSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    q: z.string().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  }).strict(),
  params: z.object({}).strict()
});

// Pharmacists cannot submit status/owner fields. Their request is always pending.
exports.pharmacistCreateSchema = z.object({
  body: z.object(commonCreateFields).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});
exports.adminCreateSchema = z.object({
  body: z.object({ ...commonCreateFields, status: statusEnum.optional().default('active') }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

// Property-level authorization: only admins may submit status changes on this route.
exports.pharmacistUpdateSchema = z.object({
  body: z.object(commonUpdateFields).strict(),
  query: z.object({}).strict(),
  params: z.object({ id: objectId })
});
exports.adminUpdateSchema = z.object({
  body: z.object({ ...commonUpdateFields, status: statusEnum.optional() }).strict(),
  query: z.object({}).strict(),
  params: z.object({ id: objectId })
});

function coords(body, existing = null) {
  return {
    latitude: body.latitude ?? body.lat ?? existing?.latitude ?? 30.0444,
    longitude: body.longitude ?? body.lng ?? existing?.longitude ?? 31.2357
  };
}

function serializePublic(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    address: p.address,
    phone: p.phone,
    status: p.status,
    latitude: p.latitude,
    longitude: p.longitude,
    location: p.location,
    working_hours: p.workingHours || '',
    google_maps_url: p.googleMapsUrl || '',
    rating: p.rating || 0
  };
}

function serializePrivate(p) {
  return {
    ...serializePublic(p),
    email: p.email || '',
    owner_id: p.ownerId || null,
    created_at: p.createdAt,
    updated_at: p.updatedAt
  };
}

function ensureAccess(req, pharmacy) {
  if (req.authRole === 'pharmacist' && String(pharmacy.ownerId || '') !== String(req.authUser._id)) {
    throw new AppError('Forbidden: pharmacists can only manage their own pharmacies', 403);
  }
}

function applyEditableFields(pharmacy, body, allowStatus) {
  for (const key of ['name', 'address', 'phone', 'email']) {
    if (body[key] !== undefined) pharmacy[key] = body[key];
  }
  if (body.workingHours !== undefined || body.working_hours !== undefined) {
    pharmacy.workingHours = body.workingHours ?? body.working_hours ?? '';
  }
  if (body.googleMapsUrl !== undefined || body.google_maps_url !== undefined) {
    pharmacy.googleMapsUrl = body.googleMapsUrl ?? body.google_maps_url ?? '';
  }
  if (body.lat !== undefined || body.lng !== undefined || body.latitude !== undefined || body.longitude !== undefined) {
    const c = coords(body, pharmacy);
    pharmacy.latitude = c.latitude;
    pharmacy.longitude = c.longitude;
  }
  if (allowStatus && body.status !== undefined) pharmacy.status = body.status;
}

exports.create = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const c = coords(body);
  const requestedStatus = req.authRole === 'pharmacist' ? 'pending' : (body.status || 'active');
  const pharmacy = await Pharmacy.create({
    name: body.name,
    address: body.address,
    phone: body.phone || '',
    email: body.email || '',
    status: requestedStatus,
    latitude: c.latitude,
    longitude: c.longitude,
    workingHours: body.workingHours || body.working_hours || '',
    googleMapsUrl: body.googleMapsUrl || body.google_maps_url || '',
    ownerId: req.authRole === 'pharmacist' ? req.authUser._id : null
  });

  if (requestedStatus === 'pending') {
    await Notification.create({
      type: 'system',
      title: 'New pharmacy request',
      message: `${pharmacy.name} submitted an onboarding request.`,
      audience: 'admin',
      recipientPharmacyId: pharmacy._id,
      createdBy: req.authUser._id,
      metadata: {
        kind: 'pharmacy_request',
        status: 'pending',
        pharmacyId: String(pharmacy._id),
        pharmacyName: pharmacy.name
      }
    });
  }
  return success(res, serializePrivate(pharmacy), 'Pharmacy created', 201);
});

exports.list = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query);
  const filter = { status: { $in: ['active', 'approved'] } };
  if (req.validated.query.q) {
    const rx = new RegExp(escapeRegex(req.validated.query.q), 'i');
    filter.$or = [{ name: rx }, { address: rx }, { phone: rx }];
  }

  const projection = 'name address phone status latitude longitude location workingHours googleMapsUrl rating';
  const [rows, total] = await Promise.all([
    Pharmacy.find(filter).select(projection).sort({ name: 1 }).skip(p.skip).limit(p.limit).lean(),
    Pharmacy.countDocuments(filter)
  ]);
  return success(res, {
    data: rows.map(serializePublic),
    pagination: { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) }
  }, 'Pharmacies loaded');
});

exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.validated.params.id);
  const pharmacy = await Pharmacy.findById(req.validated.params.id);
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  ensureAccess(req, pharmacy);

  // Defense in depth: the controller also whitelists fields even after role-specific validation.
  applyEditableFields(pharmacy, req.validated.body, req.authRole === 'admin');
  await pharmacy.save();
  return success(res, serializePrivate(pharmacy), 'Pharmacy updated');
});
