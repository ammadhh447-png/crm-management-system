const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const dealService = require('../services/deal.service');
const { DEAL_STAGES } = require('../models/Deal.model');

const dealController = {
  create: async (req, res, next) => {
    try { sendSuccess(res, await dealService.create(req.body, req), 'Deal created', 201); } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      const result = await dealService.getAll(req.query);
      if (result.overview) {
        sendSuccess(res, result);
        return;
      }
      sendPaginated(res, result.deals, result.pagination);
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { sendSuccess(res, await dealService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { sendSuccess(res, await dealService.update(req.params.id, req.body, req), 'Deal updated'); } catch (e) { next(e); }
  },
  updateStage: async (req, res, next) => {
    try { sendSuccess(res, await dealService.updateStage(req.params.id, req.body.stage, req), 'Stage updated'); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { sendSuccess(res, await dealService.delete(req.params.id, req), 'Deal deleted'); } catch (e) { next(e); }
  },
  bulkDelete: async (req, res, next) => {
    try {
      const result = await dealService.deleteMany(req.body.ids, req);
      sendSuccess(res, result, `${result.deleted} deal(s) deleted`);
    } catch (e) { next(e); }
  },
  getMeta: async (req, res, next) => {
    try { sendSuccess(res, { stages: DEAL_STAGES }); } catch (e) { next(e); }
  },
};

module.exports = dealController;
