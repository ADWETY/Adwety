'use strict';

const asyncHandler = require('../../utils/async-handler');
const notificationService = require('../../services/notification.service');

exports.notifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser({
    user: req.authUser,
    role: req.authRole,
    page: req.validated.query.page,
    limit: req.validated.query.limit
  });
  return res.json(result);
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const row = await notificationService.markReadForUser({
    id: req.validated.params.id,
    user: req.authUser,
    role: req.authRole
  });
  return res.json(row);
});
