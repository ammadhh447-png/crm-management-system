const ActivityLog = require('../models/ActivityLog.model');

const activityRepository = {
  create: (data) => ActivityLog.create(data),

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'firstName lastName email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
  },

  findByUserId: (userId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      ActivityLog.find({ userId })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ userId }),
    ]);
  },
};

module.exports = activityRepository;
