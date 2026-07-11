const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../../../middleware/auth');
const validateZod = require('../../../middleware/validateZod');
const { chatSchema } = require('../../../shared/validation/ai.schema');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please wait before trying again.' },
});

router.use(authenticate);
router.use(aiLimiter);

router.get('/status', aiController.getStatus);
router.post('/chat', validateZod(chatSchema), aiController.chat);

module.exports = router;
