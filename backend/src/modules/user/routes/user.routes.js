const express = require('express');
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission, requireSelfOrPermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');
const validate = require('../../../middleware/validate');
const { uploadLimiter } = require('../../../config/security');
const {
  updateProfileValidation,
  updateUserValidation,
  userIdValidation,
  listUsersValidation,
} = require('../validators/user.validator');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, userController.updateProfile);
router.post(
  '/profile/avatar',
  authenticate,
  uploadLimiter,
  upload.single('avatar'),
  userController.uploadAvatar
);
router.delete('/profile/avatar', authenticate, userController.removeAvatar);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.USERS_VIEW),
  listUsersValidation,
  validate,
  userController.getAllUsers
);

router.get(
  '/:id',
  authenticate,
  requireSelfOrPermission(PERMISSIONS.USERS_VIEW),
  userIdValidation,
  validate,
  userController.getUserById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.USERS_EDIT),
  updateUserValidation,
  validate,
  userController.updateUser
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.USERS_DELETE),
  userIdValidation,
  validate,
  userController.deleteUser
);

module.exports = router;
