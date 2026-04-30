const { z } = require('zod');

const stockStatus = z.enum(['in_stock', 'low_stock', 'out_of_stock', 'unknown']).optional();

const listSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    q: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    pharmacy_id: z.string().optional(),
    stock_status: stockStatus,
  }).passthrough(),
  params: z.object({}).passthrough(),
});

const byIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ inventory_id: z.string().optional() }).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

const createSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    category: z.string().min(2),
    strength: z.string().min(1),
    form: z.string().min(1),
    price: z.coerce.number().min(0),
    quantity: z.coerce.number().min(0),
    pharmacy_id: z.string().min(1),
    description: z.string().optional().default(''),
    image_url: z.string().optional().nullable(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const updateSchema = z.object({
  body: z.object({
    inventory_id: z.string().optional().nullable(),
    name: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    strength: z.string().min(1).optional(),
    form: z.string().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(0).optional(),
    pharmacy_id: z.string().optional().nullable(),
    description: z.string().optional(),
    image_url: z.string().optional().nullable(),
  }).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

module.exports = { listSchema, byIdSchema, createSchema, updateSchema };
