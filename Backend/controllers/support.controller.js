const { z } = require('zod');
const { SupportTicket } = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, isValidObjectId, pagination, escapeRegex } = require('../utils/helpers');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const statusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
const priorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

exports.listSchema = z.object({
  body: z.object({}).strict(),
  query: z.object({
    q: z.string().max(160).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50)
  }).passthrough(),
  params: z.object({}).strict()
});

exports.createSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(220),
    message: z.string().max(5000).optional().default(''),
    priority: priorityEnum.optional().default('normal'),
    userName: z.string().max(120).optional(),
    user_name: z.string().max(120).optional(),
    userEmail: z.string().email().optional().or(z.literal('')),
    user_email: z.string().email().optional().or(z.literal('')),
    pharmacyName: z.string().max(180).optional(),
    pharmacy_name: z.string().max(180).optional()
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.updateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(220).optional(),
    message: z.string().max(5000).optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    assignedAdminName: z.string().max(120).optional(),
    assigned_admin: z.string().max(120).optional(),
    resolution: z.string().max(2000).optional()
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({ id: objectId })
});

function ticketDto(ticket) {
  return {
    id: String(ticket._id || ticket.id),
    title: ticket.title,
    message: ticket.message || '',
    user: ticket.userName || ticket.userEmail || '—',
    userName: ticket.userName || '',
    user_name: ticket.userName || '',
    userEmail: ticket.userEmail || '',
    user_email: ticket.userEmail || '',
    pharmacy: ticket.pharmacyName || '—',
    pharmacyName: ticket.pharmacyName || '',
    pharmacy_name: ticket.pharmacyName || '',
    priority: ticket.priority || 'normal',
    status: ticket.status || 'open',
    assignedAdmin: ticket.assignedAdminName || '',
    assigned_admin: ticket.assignedAdminName || '',
    resolution: ticket.resolution || '',
    createdAt: ticket.createdAt,
    created_at: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    updated_at: ticket.updatedAt
  };
}

exports.list = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query);
  const filter = {};
  if (req.validated.query.status) filter.status = req.validated.query.status;
  if (req.validated.query.priority) filter.priority = req.validated.query.priority;
  if (req.validated.query.q) {
    const rx = new RegExp(escapeRegex(req.validated.query.q), 'i');
    filter.$or = [{ title: rx }, { message: rx }, { userName: rx }, { userEmail: rx }, { pharmacyName: rx }];
  }
  const [rows, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    SupportTicket.countDocuments(filter)
  ]);
  return success(res, { data: rows.map(ticketDto), pagination: { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) } }, 'Support tickets loaded');
});

exports.create = asyncHandler(async (req, res) => {
  const b = req.validated.body;
  const row = await SupportTicket.create({
    title: b.title,
    message: b.message || '',
    priority: b.priority || 'normal',
    userId: req.authUser?._id || null,
    userName: b.userName || b.user_name || req.authUser?.fullName || '',
    userEmail: b.userEmail || b.user_email || req.authUser?.email || '',
    pharmacyName: b.pharmacyName || b.pharmacy_name || ''
  });
  return success(res, ticketDto(row), 'Support ticket created', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const row = await SupportTicket.findById(req.validated.params.id);
  if (!row) throw new AppError('Support ticket not found', 404);
  const b = req.validated.body;
  if (b.title !== undefined) row.title = b.title;
  if (b.message !== undefined) row.message = b.message;
  if (b.priority !== undefined) row.priority = b.priority;
  if (b.status !== undefined) row.status = b.status;
  if (b.assignedAdminName !== undefined || b.assigned_admin !== undefined) row.assignedAdminName = b.assignedAdminName || b.assigned_admin || '';
  if (b.resolution !== undefined) row.resolution = b.resolution;
  await row.save();
  return success(res, ticketDto(row), 'Support ticket updated');
});

exports.delete = asyncHandler(async (req, res) => {
  const deleted = await SupportTicket.findByIdAndDelete(req.validated.params.id);
  if (!deleted) throw new AppError('Support ticket not found', 404);
  return success(res, { deleted: true }, 'Support ticket deleted');
});
