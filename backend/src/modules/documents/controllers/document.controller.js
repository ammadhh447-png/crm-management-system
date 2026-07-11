const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const documentService = require('../services/document.service');

const documentController = {
  upload: async (req, res, next) => {
    try {
      if (!req.file) return next(new Error('No file uploaded'));
      sendSuccess(res, await documentService.upload(req.file, req.body, req), 'Uploaded', 201);
    } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      const result = await documentService.getAll(req.query);
      sendPaginated(res, result.documents, result.pagination);
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { sendSuccess(res, await documentService.getById(req.params.id)); } catch (e) { next(e); }
  },
  getDownloadUrl: async (req, res, next) => {
    try { sendSuccess(res, await documentService.getDownloadUrl(req.params.id)); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { sendSuccess(res, await documentService.delete(req.params.id, req)); } catch (e) { next(e); }
  },
  createVersion: async (req, res, next) => {
    try {
      if (!req.file) return next(new Error('No file uploaded'));
      sendSuccess(res, await documentService.createVersion(req.params.id, req.file, req), 'Version created', 201);
    } catch (e) { next(e); }
  },
};

module.exports = documentController;
