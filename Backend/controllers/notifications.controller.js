'use strict';

const { z } = require('zod');
const { Notification, Pharmacy } = require('../models');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, isValidObjectId } = require('../utils/helpers');
const notificationService = require('../services/notification.service');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const emptyBody = z.object({}).strict();

exports.listSchema = z.object({
  body: emptyBody,
  query: z.object({
    type: z.enum(['stock', 'system']).optional(),
    unread: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50)
  }).strict(),
  params: z.object({}).strict()
});

exports.byIdSchema = z.object({ body: emptyBody, query: z.object({}).strict(), params: z.object({ id: objectId }) });
exports.notifyPharmacySchema = z.object({
  body: z.object({
    pharmacyId: objectId.optional(),
    pharmacy_id: objectId.optional(),
    title: z.string().min(2).max(200),
    message: z.string().min(2).max(2000),
    type: z.enum(['stock', 'system']).optional().default('stock'),
    metadata: z.record(z.any()).optional().default({})
  }).strict().refine((value) => value.pharmacyId || value.pharmacy_id, 'pharmacyId is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.list = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser({
    user: req.authUser,
    role: req.authRole,
    ...req.validated.query
  });
  return success(res, result, 'Notifications loaded');
});

exports.markRead = asyncHandler(async (req, res) => {
  const row = await notificationService.markReadForUser({
    id: req.validated.params.id,
    user: req.authUser,
    role: req.authRole
  });
  return success(res, row, 'Notification marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllReadForUser({ user: req.authUser, role: req.authRole });
  return success(res, result, 'Notifications marked as read');
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteForUser({
    id: req.validated.params.id,
    user: req.authUser,
    role: req.authRole
  });
  return success(res, result, 'Notification deleted');
});

exports.notifyPharmacy = asyncHandler(async (req, res) => {
  if (auth.normalizeRole(req.authRole) !== 'admin') throw new AppError('Forbidden: only admins can notify pharmacies', 403);
  const pharmacyId = req.validated.body.pharmacyId || req.validated.body.pharmacy_id;
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  const row = await Notification.create({
    type: req.validated.body.type || 'stock',
    title: req.validated.body.title,
    message: req.validated.body.message,
    audience: 'pharmacist',
    recipientPharmacyId: pharmacy._id,
    recipientUserId: pharmacy.ownerId || null,
    createdBy: req.authUser._id,
    metadata: req.validated.body.metadata || {}
  });
  return success(res, notificationService.dto(row, req.authUser._id), 'Pharmacy notified', 201);
});
