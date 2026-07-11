const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();
router.use(authenticate);
router.get('/', requirePermission(PERMISSIONS.SETTINGS_VIEW), settingsController.get);
router.put('/', requirePermission(PERMISSIONS.SETTINGS_MANAGE), settingsController.update);
router.post('/custom-fields/:entity', requirePermission(PERMISSIONS.SETTINGS_MANAGE), settingsController.addCustomField);
router.delete('/custom-fields/:entity/:fieldName', requirePermission(PERMISSIONS.SETTINGS_MANAGE), settingsController.removeCustomField);

module.exports = router;
