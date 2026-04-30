const Notification = require('../../../DB/Models/notification.model');
const User = require('../../../DB/Models/user.model');
async function listNotifications(userId = null) {
  let effectiveUserId = userId;
  if (!effectiveUserId) { const user = await User.findOne({ email: 'mona@adwety.app' }).lean(); effectiveUserId = user?._id || null; }
  if (!effectiveUserId) return [];
  const notifications = await Notification.find({ userId: effectiveUserId }).sort({ createdAt: -1 }).lean();
  return notifications.map((item) => ({ id: item._id.toString(), type: item.type, title: item.title, message: item.message, is_read: item.isRead, created_at: item.createdAt }));
}
module.exports = { listNotifications };
