const { sendSuccess } = require('../../../shared/utils/response');
const settingsService = require('../services/settings.service');

const settingsController = {
  get: async (req, res, next) => {
    try { sendSuccess(res, await settingsService.get()); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { sendSuccess(res, await settingsService.update(req.body, req), 'Settings updated'); } catch (e) { next(e); }
  },
  addCustomField: async (req, res, next) => {
    try { sendSuccess(res, await settingsService.addCustomField(req.params.entity, req.body), 'Field added'); } catch (e) { next(e); }
  },
  removeCustomField: async (req, res, next) => {
    try { sendSuccess(res, await settingsService.removeCustomField(req.params.entity, req.params.fieldName)); } catch (e) { next(e); }
  },
};

module.exports = settingsController;
