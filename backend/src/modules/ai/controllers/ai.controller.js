const { sendSuccess } = require('../../../shared/utils/response');
const AppError = require('../../../shared/errors/AppError');
const aiService = require('../services/ai.service');

const aiController = {
  getStatus: async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      sendSuccess(res, aiService.getStatusDetails());
    } catch (e) {
      next(e);
    }
  },

  chat: async (req, res, next) => {
    try {
      const { messages } = req.body;
      const result = await aiService.chat(messages, {
        name: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.roleLabel || req.user.role,
      });
      sendSuccess(res, result);
    } catch (e) {
      if (e instanceof AppError || e.isOperational) return next(e);
      next(e);
    }
  },
};

module.exports = aiController;
