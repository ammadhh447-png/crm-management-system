const express = require('express');
const communicationController = require('../controllers/communication.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/templates', requirePermission(PERMISSIONS.COMMUNICATIONS_VIEW), communicationController.getTemplates);
router.post('/templates', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.createTemplate);
router.put('/templates/:id', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.updateTemplate);
router.delete('/templates/:id', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.deleteTemplate);
router.post('/send-email', requirePermission(PERMISSIONS.COMMUNICATIONS_SEND), communicationController.sendEmail);
router.post('/bulk-delete', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.bulkDelete);
router.get('/', requirePermission(PERMISSIONS.COMMUNICATIONS_VIEW), communicationController.getAll);
router.post('/', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.create);
router.delete('/:id', requirePermission(PERMISSIONS.COMMUNICATIONS_CREATE), communicationController.delete);

module.exports = router;
