const Task = require('../models/Task.model');
const activityService = require('../../activity/services/activity.service');
const notificationService = require('../../notifications/services/notification.service');
const AppError = require('../../../shared/errors/AppError');
const { parsePagination } = require('../../../shared/utils/pagination');

const taskService = {
  create: async (data, req) => {
    const task = await Task.create({
      ...data,
      assignedTo: data.assignedTo || req.user._id,
      createdBy: req.user._id,
    });

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      await notificationService.notifyUser({
        userId: task.assignedTo,
        title: 'New Task Assigned',
        message: task.title,
        type: 'task',
        link: '/tasks',
        skipUserId: req.user._id,
      });
    }

    await activityService.log({
      userId: req.user._id, action: 'create', module: 'tasks',
      description: `Task created: ${task.title}`, targetId: task._id.toString(), targetType: 'task', req,
    });

    return task.populate(['assignedTo', 'contact', 'deal']);
  },

  getAll: async (filters = {}, options = {}) => {
    const { page, limit, skip, buildMeta } = parsePagination(options);
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.from || filters.to) {
      query.dueDate = {};
      if (filters.from) query.dueDate.$gte = new Date(filters.from);
      if (filters.to) query.dueDate.$lte = new Date(filters.to);
    }

    const [tasks, total] = await Promise.all([
      Task.find(query).populate('assignedTo contact deal').sort('-createdAt').skip(skip).limit(limit),
      Task.countDocuments(query),
    ]);
    return { tasks, pagination: buildMeta(total) };
  },

  getCalendar: async (year, month, userId) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const query = { dueDate: { $gte: start, $lte: end } };
    if (userId) query.assignedTo = userId;
    return Task.find(query).populate('assignedTo contact').sort('dueDate');
  },

  getById: async (id) => {
    const task = await Task.findById(id).populate('assignedTo contact deal createdBy');
    if (!task) throw new AppError('Task not found', 404);
    return task;
  },

  update: async (id, data, req) => {
    const existing = await Task.findById(id);
    if (!existing) throw new AppError('Task not found', 404);

    if (data.status === 'done') data.completedAt = new Date();

    const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignedTo contact deal');
    if (!task) throw new AppError('Task not found', 404);

    const newAssignee = data.assignedTo?.toString();
    const oldAssignee = existing.assignedTo?.toString();
    if (newAssignee && newAssignee !== oldAssignee) {
      await notificationService.notifyUser({
        userId: data.assignedTo,
        title: 'Task Assigned to You',
        message: task.title,
        type: 'task',
        link: '/tasks',
        skipUserId: req.user._id,
      });
    }

    await activityService.log({
      userId: req.user._id, action: 'update', module: 'tasks',
      description: `Task updated: ${task.title}`, targetId: id, targetType: 'task', req,
    });
    return task;
  },

  delete: async (id, req) => {
    const task = await Task.findByIdAndDelete(id);
    if (!task) throw new AppError('Task not found', 404);
    await activityService.log({
      userId: req.user._id, action: 'delete', module: 'tasks',
      description: `Task deleted: ${task.title}`, targetId: id, targetType: 'task', req,
    });
    return { message: 'Task deleted' };
  },

  deleteMany: async (ids, req) => {
    if (!Array.isArray(ids) || !ids.length) throw new AppError('No tasks selected', 400);

    const tasks = await Task.find({ _id: { $in: ids } });
    if (!tasks.length) throw new AppError('No tasks found', 404);

    await Task.deleteMany({ _id: { $in: ids } });

    await activityService.log({
      userId: req.user._id,
      action: 'delete',
      module: 'tasks',
      description: `${tasks.length} task(s) deleted`,
      metadata: { count: tasks.length },
      req,
    });

    return { deleted: tasks.length };
  },
};

module.exports = taskService;
