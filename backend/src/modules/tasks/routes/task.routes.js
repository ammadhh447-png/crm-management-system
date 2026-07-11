const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { PERMISSIONS } = require('../../../shared/constants/permissions');

const router = express.Router();
router.use(authenticate);

router.get('/meta', taskController.getMeta);
router.get('/calendar', requirePermission(PERMISSIONS.TASKS_VIEW), taskController.getCalendar);
router.get('/', requirePermission(PERMISSIONS.TASKS_VIEW), taskController.getAll);
router.post('/bulk-delete', requirePermission(PERMISSIONS.TASKS_DELETE), taskController.bulkDelete);
router.post('/', requirePermission(PERMISSIONS.TASKS_CREATE), taskController.create);
router.get('/:id', requirePermission(PERMISSIONS.TASKS_VIEW), taskController.getById);
router.put('/:id', requirePermission(PERMISSIONS.TASKS_EDIT), taskController.update);
router.delete('/:id', requirePermission(PERMISSIONS.TASKS_DELETE), taskController.delete);

module.exports = router;
