const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
