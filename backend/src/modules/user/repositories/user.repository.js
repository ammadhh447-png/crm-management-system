const User = require('../models/User.model');

const userRepository = {
  create: (data) => User.create(data),

  findById: (id) => User.findById(id),

  findBySupabaseId: (supabaseId) => User.findOne({ supabaseId }),

  findByEmail: (email) => User.findOne({ email: email.toLowerCase() }),

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
  },

  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  updateBySupabaseId: (supabaseId, data) =>
    User.findOneAndUpdate({ supabaseId }, data, { new: true, runValidators: true }),

  deleteById: (id) => User.findByIdAndDelete(id),

  count: (filter = {}) => User.countDocuments(filter),

  exists: (filter) => User.exists(filter),
};

module.exports = userRepository;
