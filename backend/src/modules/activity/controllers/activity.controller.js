const activityService = require('../services/activity.service');
const { sendPaginated } = require('../../../shared/utils/response');

const activityController = {
  getLogs: async (req, res, next) => {
    try {
      const { page, limit, module, action, userId } = req.query;
      const filter = {};

      if (module) filter.module = module;
      if (action) filter.action = action;
      if (userId) filter.userId = userId;

      const result = await activityService.getLogs(filter, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      });

      sendPaginated(res, result.logs, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  getMyLogs: async (req, res, next) => {
    try {
      const { page, limit } = req.query;

      const result = await activityService.getUserLogs(req.user._id, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      });

      sendPaginated(res, result.logs, result.pagination);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = activityController;
