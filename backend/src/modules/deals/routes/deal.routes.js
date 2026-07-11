const express = require('express');
const dealController = require('../controllers/deal.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/meta', dealController.getMeta);
router.get('/', requirePermission(PERMISSIONS.DEALS_VIEW), dealController.getAll);
router.post('/bulk-delete', requirePermission(PERMISSIONS.DEALS_DELETE), dealController.bulkDelete);
router.post('/', requirePermission(PERMISSIONS.DEALS_CREATE), dealController.create);
router.get('/:id', requirePermission(PERMISSIONS.DEALS_VIEW), dealController.getById);
router.put('/:id', requirePermission(PERMISSIONS.DEALS_EDIT), dealController.update);
router.patch('/:id/stage', requirePermission(PERMISSIONS.DEALS_EDIT), dealController.updateStage);
router.delete('/:id', requirePermission(PERMISSIONS.DEALS_DELETE), dealController.delete);

module.exports = router;
