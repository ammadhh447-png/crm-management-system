const AppError = require('../shared/errors/AppError');
const { ROLE_PERMISSIONS } = require('../shared/constants/permissions');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient role privileges', 403));
  }
  next();
};

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
  const hasPermission = permissions.every((p) => userPermissions.includes(p));

  if (!hasPermission) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

const requireSelfOrPermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const targetId = req.params.id || req.params.userId;
  const isSelf = targetId && targetId === req.user._id.toString();

  if (isSelf) {
    return next();
  }

  const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
  if (!userPermissions.includes(permission)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { requireRole, requirePermission, requireSelfOrPermission };
