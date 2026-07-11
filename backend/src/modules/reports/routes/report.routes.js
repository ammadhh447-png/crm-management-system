const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();
router.use(authenticate);
router.get('/dashboard', requirePermission(PERMISSIONS.DASHBOARD_VIEW), reportController.getDashboard);
router.get('/export', requirePermission(PERMISSIONS.REPORTS_EXPORT), reportController.exportReport);

module.exports = router;
