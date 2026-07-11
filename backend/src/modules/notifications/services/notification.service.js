const mongoose = require('mongoose');
const Notification = require('../models/Notification.model');
const userRepository = require('../../user/repositories/user.repository');
const { emitToUser } = require('../../../config/socket');

const toObjectId = (id) => {
  if (!id) return null;
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
};

const emitUnreadCount = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user?.supabaseId) return;

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  emitToUser(user.supabaseId, 'notification:count', { unreadCount });
};

const notifyUser = async ({ userId, title, message, type, link, metadata, skipUserId }) => {
  const targetId = toObjectId(userId);
  if (!targetId) return null;
  if (skipUserId && targetId.toString() === skipUserId.toString()) return null;

  const notification = await Notification.create({
    userId: targetId,
    title,
    message,
    type,
    link,
    metadata,
  });

  const user = await userRepository.findById(targetId);
  if (user?.supabaseId) {
    emitToUser(user.supabaseId, 'notification', notification.toJSON());
    await emitUnreadCount(targetId);
  }

  return notification;
};

const notificationService = {
  notifyUser,

  create: async (payload) => notifyUser(payload),

  getByUser: async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
    const filter = { userId };
    if (unreadOnly) filter.isRead = false;
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ]);
    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  markRead: async (id, userId) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    if (notification) await emitUnreadCount(userId);
    return notification;
  },

  markAllRead: async (userId) => {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    await emitUnreadCount(userId);
  },
};

module.exports = notificationService;
