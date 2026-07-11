const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');
const taskService = require('../services/task.service');
const { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } = require('../models/Task.model');

const taskController = {
  create: async (req, res, next) => {
    try { sendSuccess(res, await taskService.create(req.body, req), 'Task created', 201); } catch (e) { next(e); }
  },
  getAll: async (req, res, next) => {
    try {
      const result = await taskService.getAll(req.query, req.query);
      sendPaginated(res, result.tasks, result.pagination);
    } catch (e) { next(e); }
  },
  getCalendar: async (req, res, next) => {
    try {
      const { year, month, userId } = req.query;
      sendSuccess(res, await taskService.getCalendar(+year, +month, userId));
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { sendSuccess(res, await taskService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { sendSuccess(res, await taskService.update(req.params.id, req.body, req), 'Task updated'); } catch (e) { next(e); }
  },
  delete: async (req, res, next) => {
    try { sendSuccess(res, await taskService.delete(req.params.id, req)); } catch (e) { next(e); }
  },
  bulkDelete: async (req, res, next) => {
    try {
      const result = await taskService.deleteMany(req.body.ids, req);
      sendSuccess(res, result, `${result.deleted} task(s) deleted`);
    } catch (e) { next(e); }
  },
  getMeta: async (req, res, next) => {
    try { sendSuccess(res, { types: TASK_TYPES, priorities: TASK_PRIORITIES, statuses: TASK_STATUSES }); } catch (e) { next(e); }
  },
};

module.exports = taskController;
