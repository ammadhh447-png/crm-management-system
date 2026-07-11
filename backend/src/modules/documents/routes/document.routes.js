const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const { uploadLimiter } = require('../../../config/security');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate);
router.get('/', requirePermission(PERMISSIONS.DOCUMENTS_VIEW), documentController.getAll);
router.post('/upload', uploadLimiter, requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD), upload.single('file'), documentController.upload);
router.get('/:id', requirePermission(PERMISSIONS.DOCUMENTS_VIEW), documentController.getById);
router.get('/:id/download', requirePermission(PERMISSIONS.DOCUMENTS_VIEW), documentController.getDownloadUrl);
router.post('/:id/version', requirePermission(PERMISSIONS.DOCUMENTS_UPLOAD), upload.single('file'), documentController.createVersion);
router.delete('/:id', requirePermission(PERMISSIONS.DOCUMENTS_DELETE), documentController.delete);

module.exports = router;
