const userService = require('../services/user.service');
const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');

const userController = {
  getProfile: async (req, res, next) => {
    try {
      const user = await userService.getProfile(req.user._id, req.supabaseUser);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const user = await userService.updateProfile(req.user._id, req.body, req);
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  uploadAvatar: async (req, res, next) => {
    try {
      const user = await userService.uploadProfileAvatar(req.user._id, req.file, req);
      sendSuccess(res, user, 'Profile photo updated');
    } catch (err) {
      next(err);
    }
  },

  removeAvatar: async (req, res, next) => {
    try {
      const user = await userService.removeProfileAvatar(req.user._id, req);
      sendSuccess(res, user, 'Profile photo removed');
    } catch (err) {
      next(err);
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      const { page, limit, role, isActive, search } = req.query;
      const result = await userService.getAllUsers(
        { role, isActive, search },
        {
          page: parseInt(page, 10) || 1,
          limit: parseInt(limit, 10) || 10,
        }
      );
      sendPaginated(res, result.users, result.pagination);
    } catch (err) {
      next(err);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const user = await userService.getProfile(req.params.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req);
      sendSuccess(res, user, 'User updated');
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const result = await userService.deleteUser(req.params.id, req);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
