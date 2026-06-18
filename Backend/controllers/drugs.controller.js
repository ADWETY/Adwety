const { z } = require('zod');
const { Drug, Category } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, isValidObjectId, validateObjectId, pagination, escapeRegex } = require('../utils/helpers');
const { findMatches, serializeDrug } = require('../services/drug-matching.service');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const arr = z.array(z.string().trim().min(1).max(120)).optional().default([]);

exports.listSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    q: z.string().max(120).optional(),
    category: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  }).strict(),
  params: z.object({}).strict()
});

exports.searchSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    q: z.string().max(120).optional(),
    query: z.string().max(120).optional(),
    drug: z.string().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(25).optional().default(10)
  }).strict().refine((v) => v.q || v.query || v.drug, 'Search query is required'),
  params: z.object({}).strict()
});

const drugBody = z.object({
  genericName: z.string().min(2).max(120).optional(),
  generic_name: z.string().min(2).max(120).optional(),
  brandNames: arr,
  brand_names: arr,
  aliases: arr,
  category: z.string().min(2).max(100).optional().default('General'),
  dosageForm: z.string().min(1).max(80).optional(),
  dosage_form: z.string().min(1).max(80).optional(),
  strength: z.string().min(1).max(80),
  description: z.string().max(2000).optional().default('')
}).strict();

exports.createSchema = z.object({
  body: drugBody.refine((v) => v.genericName || v.generic_name, 'genericName is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.updateSchema = z.object({
  body: drugBody.partial().strict(),
  query: z.object({}).strict(),
  params: z.object({ id: objectId })
});

async function ensureCategory(name) {
  return Category.findOneAndUpdate({ name }, { $setOnInsert: { description: '' } }, { upsert: true, new: true });
}

function assertPlatformAdmin(req) {
  if (req.authRole !== 'admin') throw new AppError('Forbidden: only platform admins can modify global drug catalog records', 403);
}

function payload(body) {
  return {
    genericName: body.genericName || body.generic_name,
    brandNames: body.brandNames || body.brand_names || [],
    aliases: body.aliases || [],
    category: body.category || 'General',
    dosageForm: body.dosageForm || body.dosage_form,
    strength: body.strength,
    description: body.description || ''
  };
}

exports.list = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query);
  const filter = { isActive: { $ne: false } };
  if (req.validated.query.category) filter.category = new RegExp(`^${escapeRegex(req.validated.query.category)}$`, 'i');
  if (req.validated.query.q) {
    const rx = new RegExp(escapeRegex(req.validated.query.q), 'i');
    filter.$or = [{ genericName: rx }, { brandNames: rx }, { aliases: rx }, { searchText: rx }];
  }
  const [rows, total] = await Promise.all([
    Drug.find(filter).sort({ genericName: 1 }).skip(p.skip).limit(p.limit).lean(),
    Drug.countDocuments(filter)
  ]);
  return success(res, {
    data: rows.map(serializeDrug),
    pagination: { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) }
  }, 'Drugs loaded');
});

exports.search = asyncHandler(async (req, res) => success(res, await findMatches(req.validated.query.q || req.validated.query.query || req.validated.query.drug, { limit: req.validated.query.limit }), 'Drug search completed'));

exports.create = asyncHandler(async (req, res) => {
  assertPlatformAdmin(req);
  const data = payload(req.validated.body);
  await ensureCategory(data.category);
  const exists = await Drug.findOne({
    genericName: new RegExp(`^${escapeRegex(data.genericName)}$`, 'i'),
    strength: data.strength,
    dosageForm: data.dosageForm,
    isActive: { $ne: false }
  });
  if (exists) throw new AppError('Drug already exists', 409);
  const drug = await Drug.create({ ...data, isActive: true });
  return success(res, serializeDrug(drug), 'Drug created', 201);
});

exports.update = asyncHandler(async (req, res) => {
  assertPlatformAdmin(req);
  validateObjectId(req.validated.params.id);
  const drug = await Drug.findById(req.validated.params.id);
  if (!drug) throw new AppError('Drug not found', 404);

  const next = payload({ ...drug.toObject(), ...req.validated.body });
  Object.assign(drug, next);
  // SECURITY/STATE SYNC: global catalog updates must not silently hide records.
  // There is no public soft-delete endpoint here; keep updated records listable.
  drug.isActive = true;
  await ensureCategory(drug.category);
  await drug.save();
  return success(res, serializeDrug(drug), 'Drug updated');
});
