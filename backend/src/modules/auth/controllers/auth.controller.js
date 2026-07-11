const authService = require('../services/auth.service');
const { sendSuccess } = require('../../../shared/utils/response');

const authController = {
  register: async (req, res, next) => {
    try {
      const user = await authService.register(req.supabaseUser, req.body, req);

      authService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});

      sendSuccess(res, user, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },

  syncSession: async (req, res, next) => {
    try {
      const user = await authService.syncSession(req.supabaseUser, req);
      sendSuccess(res, user, 'Session synced');
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await authService.getCurrentUser(req.user, req.supabaseUser);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  getRoles: async (req, res, next) => {
    try {
      const roles = authService.getRoles();
      sendSuccess(res, roles);
    } catch (err) {
      next(err);
    }
  },

  getPermissions: async (req, res, next) => {
    try {
      const permissions = authService.getPermissions();
      sendSuccess(res, permissions);
    } catch (err) {
      next(err);
    }
  },

  passwordResetComplete: async (req, res, next) => {
    try {
      await authService.logPasswordReset(req.user._id, req);
      sendSuccess(res, null, 'Password reset logged');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
