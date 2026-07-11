const activityRepository = require('../repositories/activity.repository');

const activityService = {
  log: async ({ userId, action, module, description, targetId, targetType, metadata, req }) => {
    const logData = {
      userId,
      action,
      module,
      description,
      targetId: targetId || null,
      targetType: targetType || null,
      metadata: metadata || {},
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
    };

    return activityRepository.create(logData);
  },

  getLogs: async (filter = {}, options = {}) => {
    const [logs, total] = await activityRepository.findAll(filter, options);
    const { page = 1, limit = 10 } = options;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getUserLogs: async (userId, options = {}) => {
    const [logs, total] = await activityRepository.findByUserId(userId, options);
    const { page = 1, limit = 10 } = options;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

module.exports = activityService;
