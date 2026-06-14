'use strict';

const { Notification } = require('../models');
const auth = require('../middleware/auth');
const { AppError } = require('../utils/helpers');

function normalizedRole(role) {
  return auth.normalizeRole(role) || 'patient';
}

function accessFilter(user, role) {
  const userId = user._id;
  const audience = normalizedRole(role || user.role);
  const or = [
    { recipientUserId: userId },
    { createdBy: userId },
    { audience: 'all', recipientUserId: null, recipientPharmacyId: null },
    { audience, recipientUserId: null, recipientPharmacyId: null }
  ];
  if (user.pharmacyId) or.push({ recipientPharmacyId: user.pharmacyId });
  return { $or: or, deletedBy: { $ne: userId } };
}

function dto(row, userId) {
  const readBy = (row.readBy || []).map(String);
  const isRead = readBy.includes(String(userId));
  return {
    id: String(row._id || row.id),
    type: row.type || 'system',
    title: String(row.title || ''),
    message: String(row.message || ''),
    audience: row.audience || 'all',
    recipientUserId: row.recipientUserId || null,
    recipient_user_id: row.recipientUserId || null,
    recipientPharmacyId: row.recipientPharmacyId || null,
    recipient_pharmacy_id: row.recipientPharmacyId || null,
    metadata: row.metadata || {},
    read: isRead,
    isRead,
    is_read: isRead,
    createdAt: row.createdAt,
    created_at: row.createdAt,
    updatedAt: row.updatedAt,
    updated_at: row.updatedAt
  };
}

async function listForUser({ user, role, page = 1, limit = 50, type, unread }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const filter = accessFilter(user, role);
  if (type) filter.type = type;
  if (unread === true) filter.readBy = { $ne: user._id };
  const [rows, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(filter)
  ]);
  return {
    data: rows.map((row) => dto(row, user._id)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
}

async function markReadForUser({ id, user, role }) {
  const row = await Notification.findOneAndUpdate(
    { _id: id, ...accessFilter(user, role) },
    { $addToSet: { readBy: user._id } },
    { new: true }
  );
  if (!row) throw new AppError('Notification not found', 404);
  return dto(row, user._id);
}

async function markAllReadForUser({ user, role }) {
  const result = await Notification.updateMany(
    accessFilter(user, role),
    { $addToSet: { readBy: user._id } }
  );
  return { updated: result.modifiedCount };
}

async function deleteForUser({ id, user, role }) {
  const row = await Notification.findOneAndUpdate(
    { _id: id, ...accessFilter(user, role) },
    { $addToSet: { deletedBy: user._id } },
    { new: true }
  );
  if (!row) throw new AppError('Notification not found', 404);
  return { deleted: true };
}

module.exports = {
  accessFilter,
  dto,
  listForUser,
  markReadForUser,
  markAllReadForUser,
  deleteForUser
};
