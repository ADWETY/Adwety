const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).max(100).optional(),
    phone_number: z.string().max(32).optional(),
  }).refine((value) => value.full_name !== undefined || value.phone_number !== undefined, 'At least one field is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

const requestEmailUpdateSchema = z.object({
  body: z.object({
    email: z.string().email().max(254),
  }),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

const confirmEmailUpdateSchema = z.object({
  body: z.object({
    otp_token: z.string().min(32).max(256),
    otp: z.string().min(4).max(10).regex(/^[0-9]+$/, 'OTP must be numeric'),
  }),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});

module.exports = {
  updateProfileSchema,
  requestEmailUpdateSchema,
  confirmEmailUpdateSchema,
};
