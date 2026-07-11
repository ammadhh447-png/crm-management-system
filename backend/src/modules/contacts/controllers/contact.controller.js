const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const contactService = require('../services/contact.service');
const { LEAD_SOURCES, LEAD_STATUSES, CONTACT_TYPES } = require('../models/Contact.model');

const contactController = {
  create: async (req, res, next) => {
    try { sendSuccess(res, await contactService.create(req.body, req), 'Contact created', 201); } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      const result = await contactService.getAll(req.query, req.query);
      sendPaginated(res, result.contacts, result.pagination);
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { sendSuccess(res, await contactService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { sendSuccess(res, await contactService.update(req.params.id, req.body, req), 'Contact updated'); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { sendSuccess(res, await contactService.delete(req.params.id, req)); } catch (e) { next(e); }
  },
  bulkDelete: async (req, res, next) => {
    try {
      const result = await contactService.deleteMany(req.body.ids, req);
      sendSuccess(res, result, `${result.deleted} contact(s) deleted`);
    } catch (e) { next(e); }
  },
  getDuplicates: async (req, res, next) => {
    try { sendSuccess(res, await contactService.findDuplicates()); } catch (e) { next(e); }
  },
  importCSV: async (req, res, next) => {
    try {
      if (!req.file) return next(new Error('No file uploaded'));
      sendSuccess(res, await contactService.importCSV(req.file.buffer, req), 'Import completed');
    } catch (e) { next(e); }
  },
  exportData: async (req, res, next) => {
    try {
      const format = req.query.format || 'csv';
      const buffer = await contactService.exportData(format);
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      const mime = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename=contacts.${ext}`);
      res.send(buffer);
    } catch (e) { next(e); }
  },
  getCompanies: async (req, res, next) => {
    try { sendSuccess(res, await contactService.getCompanies(req.query.search)); } catch (e) { next(e); }
  },
  createCompany: async (req, res, next) => {
    try { sendSuccess(res, await contactService.createCompany(req.body, req), 'Company created', 201); } catch (e) { next(e); }
  },
  getMeta: async (req, res, next) => {
    try { sendSuccess(res, { leadSources: LEAD_SOURCES, leadStatuses: LEAD_STATUSES, contactTypes: CONTACT_TYPES }); } catch (e) { next(e); }
  },
};

module.exports = contactController;
