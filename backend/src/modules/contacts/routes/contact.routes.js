const express = require('express');
const multer = require('multer');
const contactController = require('../controllers/contact.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const { uploadLimiter } = require('../../../config/security');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/meta', contactController.getMeta);
router.get('/duplicates', requirePermission(PERMISSIONS.CONTACTS_VIEW), contactController.getDuplicates);
router.get('/export', requirePermission(PERMISSIONS.CONTACTS_VIEW), contactController.exportData);
router.post('/import', uploadLimiter, requirePermission(PERMISSIONS.CONTACTS_IMPORT), upload.single('file'), contactController.importCSV);
router.get('/companies', requirePermission(PERMISSIONS.CONTACTS_VIEW), contactController.getCompanies);
router.post('/companies', requirePermission(PERMISSIONS.CONTACTS_CREATE), contactController.createCompany);
router.get('/', requirePermission(PERMISSIONS.CONTACTS_VIEW), contactController.getAll);
router.post('/bulk-delete', requirePermission(PERMISSIONS.CONTACTS_DELETE), contactController.bulkDelete);
router.post('/', requirePermission(PERMISSIONS.CONTACTS_CREATE), contactController.create);
router.get('/:id', requirePermission(PERMISSIONS.CONTACTS_VIEW), contactController.getById);
router.put('/:id', requirePermission(PERMISSIONS.CONTACTS_EDIT), contactController.update);
router.delete('/:id', requirePermission(PERMISSIONS.CONTACTS_DELETE), contactController.delete);

module.exports = router;
