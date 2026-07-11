const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const communicationService = require('../services/communication.service');

const communicationController = {
  create: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.create(req.body, req), 'Logged', 201); } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      const result = await communicationService.getAll(req.query, req.query);
      sendPaginated(res, result.communications, result.pagination);
    } catch (e) { next(e); }
  },
  sendEmail: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.sendEmail(req.body, req), 'Email sent'); } catch (e) { next(e); }
  },
  getTemplates: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.getTemplates()); } catch (e) { next(e); }
  },
  createTemplate: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.createTemplate(req.body, req), 'Template created', 201); } catch (e) { next(e); }
  },
  updateTemplate: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.updateTemplate(req.params.id, req.body)); } catch (e) { next(e); }
  },
  deleteTemplate: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.deleteTemplate(req.params.id)); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { sendSuccess(res, await communicationService.deleteById(req.params.id, req), 'Communication deleted'); } catch (e) { next(e); }
  },
  bulkDelete: async (req, res, next) => {
    try {
      const result = await communicationService.deleteMany(req.body.ids, req);
      sendSuccess(res, result, `${result.deleted} communication(s) deleted`);
    } catch (e) { next(e); }
  },
};

module.exports = communicationController;
