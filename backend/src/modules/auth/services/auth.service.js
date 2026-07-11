const { frontendUrl } = require('../../../config/env');
const { sendEmailSafe } = require('../../../shared/utils/email');
const userService = require('../../user/services/user.service');
const activityService = require('../../activity/services/activity.service');
const AppError = require('../../../shared/errors/AppError');
const { ROLE_PERMISSIONS } = require('../../../shared/constants/permissions');
const { ALL_ROLES, ROLE_LABELS } = require('../../../shared/constants/roles');

const authService = {
  register: async (supabaseUser, profileData, req) => {
    return userService.createProfile(supabaseUser, profileData, req);
  },

  syncSession: async (supabaseUser, req) => {
    return userService.syncSession(supabaseUser, req);
  },

  getCurrentUser: async (user, supabaseUser) => {
    return userService.getProfile(user._id, supabaseUser);
  },

  sendWelcomeEmail: async (email, firstName) => {
    await sendEmailSafe({
      to: email,
      subject: 'Welcome to CRM Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Welcome, ${firstName}!</h2>
          <p style="color: #475569;">Your account has been created successfully.</p>
          <p style="color: #475569;">You can now access the CRM system and manage your work efficiently.</p>
          <a href="${frontendUrl}/login" style="display: inline-block; padding: 12px 24px; background: #1e293b; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Go to Login</a>
        </div>
      `,
    });
  },

  sendPasswordResetNotification: async (email) => {
    await sendEmailSafe({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Password Reset</h2>
          <p style="color: #475569;">A password reset was requested for your account.</p>
          <p style="color: #475569;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  },

  logPasswordReset: async (userId, req) => {
    await activityService.log({
      userId,
      action: 'password_reset',
      module: 'auth',
      description: 'Password reset completed',
      req,
    });
  },

  getRoles: () => {
    return ALL_ROLES.map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      permissions: ROLE_PERMISSIONS[role] || [],
    }));
  },

  getPermissions: () => {
    const allPermissions = new Set();
    Object.values(ROLE_PERMISSIONS).forEach((perms) => {
      perms.forEach((p) => allPermissions.add(p));
    });

    return Array.from(allPermissions).map((permission) => {
      const [resource, action] = permission.split(':');
      return { permission, resource, action };
    });
  },
};

module.exports = authService;
