const Notification = require('../../../DB/Models/notification.model');
const { AppError } = require('../../utils/error-handling');

async function listNotifications(userId = null) {
  if (!userId) throw new AppError('Authentication required', 401);
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  return notifications.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    message: item.message,
    is_read: item.isRead,
    created_at: item.createdAt,
  }));
}

module.exports = { listNotifications };
