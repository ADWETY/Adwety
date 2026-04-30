const { z } = require('zod');

const statusSchema = z.enum(['pending', 'approved', 'rejected', 'active', 'inactive']);

const listSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    featured: z.string().optional(),
    q: z.string().optional(),
    status: statusSchema.optional(),
  }).passthrough(),
  params: z.object({}).passthrough(),
});

const byIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

const createSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
    phone: z.string().optional().default(''),
    email: z.string().email().optional().or(z.literal('')).default(''),
    working_hours: z.string().optional().default(''),
    status: statusSchema.optional().default('active'),
    rating: z.coerce.number().min(0).max(5).optional().default(0),
    latitude: z.coerce.number().optional().default(30.0444),
    longitude: z.coerce.number().optional().default(31.2357),
    google_maps_url: z.string().optional().default(''),
    is_featured: z.boolean().optional().default(false),
    image_url: z.string().optional().nullable(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const updateSchema = z.object({
  body: createSchema.shape.body.partial(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

module.exports = { listSchema, byIdSchema, createSchema, updateSchema };
