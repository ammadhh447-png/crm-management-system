const express = require('express');
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ACTIVITY_VIEW),
  activityController.getLogs
);

router.get('/me', authenticate, activityController.getMyLogs);

module.exports = router;
