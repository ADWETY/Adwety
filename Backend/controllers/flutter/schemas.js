const { z } = require('zod');
const { isValidObjectId } = require('../../utils/helpers');

const consentBoolean = z.preprocess((value) => { if (typeof value !== 'string') return value; const v=value.trim().toLowerCase(); if(['true','1','yes','on'].includes(v)) return true; if(['false','0','no','off',''].includes(v)) return false; return value; }, z.boolean());
const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const passwordSchema = z.string().min(12).max(128);

const DEFAULT_RADIUS_KM = 50;

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1).max(128)
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    fullName: z.string().min(2).max(100).optional(),
    full_name: z.string().min(2).max(100).optional(),
    email: z.string().email().max(254),
    password: passwordSchema,
    phoneNumber: z.string().max(32).optional(),
    phone_number: z.string().max(32).optional()
  }).strict().refine((v) => v.name || v.fullName || v.full_name, 'name is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    fullName: z.string().min(2).max(100).optional(),
    full_name: z.string().min(2).max(100).optional(),
    phoneNumber: z.string().max(32).optional(),
    phone_number: z.string().max(32).optional()
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.listSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    q: z.string().max(120).optional(),
    query: z.string().max(120).optional(),
    drug: z.string().max(120).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius_km: z.coerce.number().min(0.1).max(100).optional().default(DEFAULT_RADIUS_KM),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  }).strict(),
  params: z.object({}).strict()
});

exports.byIdSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional()
  }).strict(),
  params: z.object({
    id: objectId
  })
});

exports.notificationsSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  }).strict(),
  params: z.object({}).strict()
});

exports.notificationByIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).strict(),
  params: z.object({
    id: objectId
  })
});

exports.scanSchema = z.object({
  body: z.object({
    text: z.string().max(5000).optional(),
    mock_text: z.string().max(5000).optional(),
    consent_to_store: consentBoolean.optional().default(false),
    consentToStore: consentBoolean.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius_km: z.coerce.number().min(0.1).max(100).optional().default(DEFAULT_RADIUS_KM)
  }).passthrough(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});
