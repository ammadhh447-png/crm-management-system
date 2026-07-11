const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifySupabaseToken, authenticate } = require('../../../middleware/auth');
const validateZod = require('../../../middleware/validateZod');
const { authLimiter, syncLimiter } = require('../../../config/security');
const { registerSchema } = require('../../../shared/validation/schemas');

const router = express.Router();

router.post('/register', syncLimiter, verifySupabaseToken, validateZod(registerSchema), authController.register);
router.post('/sync', syncLimiter, verifySupabaseToken, authController.syncSession);
router.get('/me', authenticate, authController.getMe);
router.get('/roles', authenticate, authController.getRoles);
router.get('/permissions', authenticate, authController.getPermissions);
router.post('/password-reset-complete', authenticate, authController.passwordResetComplete);

module.exports = router;
