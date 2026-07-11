const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const notificationService = require('../services/notification.service');

const notificationController = {
  getAll: async (req, res, next) => {
    try {
      const result = await notificationService.getByUser(req.user._id, {
        page: +req.query.page || 1, unreadOnly: req.query.unread === 'true',
      });
      sendSuccess(res, { notifications: result.notifications, unreadCount: result.unreadCount, pagination: result.pagination });
    } catch (e) { next(e); }
  },
  markRead: async (req, res, next) => {
    try { sendSuccess(res, await notificationService.markRead(req.params.id, req.user._id)); } catch (e) { next(e); }
  },
  markAllRead: async (req, res, next) => {
    try { sendSuccess(res, await notificationService.markAllRead(req.user._id), 'All marked read'); } catch (e) { next(e); }
  },
};

module.exports = notificationController;
