const Deal = require('../models/Deal.model');
const { DEAL_STAGES } = require('../models/Deal.model');
const activityService = require('../../activity/services/activity.service');
const notificationService = require('../../notifications/services/notification.service');
const AppError = require('../../../shared/errors/AppError');
const { parsePagination } = require('../../../shared/utils/pagination');

const dealService = {
  create: async (data, req) => {
    const deal = await Deal.create({
      ...data,
      assignedTo: data.assignedTo || req.user._id,
      createdBy: req.user._id,
      history: [{ action: 'created', to: data.stage || 'prospect', userId: req.user._id, note: 'Deal created' }],
    });

    if (deal.assignedTo.toString() !== req.user._id.toString()) {
      await notificationService.notifyUser({
        userId: deal.assignedTo,
        title: 'New Deal Assigned',
        message: `Deal "${deal.title}" assigned to you`,
        type: 'deal',
        link: '/deals',
        skipUserId: req.user._id,
      });
    }

    await activityService.log({
      userId: req.user._id, action: 'create', module: 'deals',
      description: `Deal created: ${deal.title}`, targetId: deal._id.toString(), targetType: 'deal', req,
    });

    return deal.populate(['contact', 'company', 'assignedTo']);
  },

  getAll: async (filters = {}) => {
    const query = { isActive: true };

    if (filters.stage) query.stage = filters.stage;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.minValue || filters.maxValue) {
      query.value = {};
      if (filters.minValue) query.value.$gte = Number(filters.minValue);
      if (filters.maxValue) query.value.$lte = Number(filters.maxValue);
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sortField = ['title', 'value', 'stage', 'createdAt', 'updatedAt'].includes(filters.sortBy)
      ? filters.sortBy
      : 'updatedAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const populate = ['contact', 'company', 'assignedTo'];

    if (filters.overview === 'true') {
      const deals = await Deal.find(query).populate(populate).sort(sort);
      const pipeline = DEAL_STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        return {
          stage,
          deals: stageDeals.slice(0, 2),
          totalCount: stageDeals.length,
          totalValue: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        };
      });

      return { overview: true, pipeline };
    }

    const { limit, skip, buildMeta } = parsePagination(filters);

    const [deals, total] = await Promise.all([
      Deal.find(query).populate(populate).sort(sort).skip(skip).limit(limit),
      Deal.countDocuments(query),
    ]);

    return { deals, pagination: buildMeta(total) };
  },

  getById: async (id) => {
    const deal = await Deal.findById(id).populate('contact company assignedTo createdBy');
    if (!deal || !deal.isActive) throw new AppError('Deal not found', 404);
    return deal;
  },

  update: async (id, data, req) => {
    const existing = await Deal.findById(id);
    if (!existing) throw new AppError('Deal not found', 404);

    if (data.stage && data.stage !== existing.stage) {
      existing.history.push({
        action: 'stage_change', from: existing.stage, to: data.stage,
        userId: req.user._id, note: data.stageNote || '',
      });
      data.history = existing.history;

      await notificationService.notifyUser({
        userId: existing.assignedTo,
        title: 'Deal Stage Updated',
        message: `"${existing.title}" moved to ${data.stage}`,
        type: 'deal',
        link: '/deals',
      });
    }

    const newAssignee = data.assignedTo?.toString();
    const oldAssignee = existing.assignedTo?.toString();
    if (newAssignee && newAssignee !== oldAssignee) {
      await notificationService.notifyUser({
        userId: data.assignedTo,
        title: 'Deal Assigned to You',
        message: `Deal "${existing.title}" assigned to you`,
        type: 'deal',
        link: '/deals',
        skipUserId: req.user._id,
      });
    }

    const deal = await Deal.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('contact company assignedTo');

    await activityService.log({
      userId: req.user._id, action: 'update', module: 'deals',
      description: `Deal updated: ${deal.title}`, targetId: id, targetType: 'deal', req,
    });
    return deal;
  },

  updateStage: async (id, stage, req) => {
    return dealService.update(id, { stage }, req);
  },

  delete: async (id, req) => {
    const deal = await Deal.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deal) throw new AppError('Deal not found', 404);
    await activityService.log({
      userId: req.user._id, action: 'delete', module: 'deals',
      description: `Deal deleted: ${deal.title}`, targetId: id, targetType: 'deal', req,
    });
    return { message: 'Deal deleted' };
  },

  deleteMany: async (ids, req) => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new AppError('No deals selected', 400);
    }

    const deals = await Deal.find({ _id: { $in: ids }, isActive: true });
    if (!deals.length) throw new AppError('No deals found', 404);

    await Deal.updateMany({ _id: { $in: ids } }, { isActive: false });

    await activityService.log({
      userId: req.user._id,
      action: 'delete',
      module: 'deals',
      description: `${deals.length} deal(s) deleted`,
      metadata: { count: deals.length },
      req,
    });

    return { deleted: deals.length };
  },
};

module.exports = dealService;
