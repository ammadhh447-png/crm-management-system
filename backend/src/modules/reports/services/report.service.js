const Contact = require('../../contacts/models/Contact.model');
const Deal = require('../../deals/models/Deal.model');
const Task = require('../../tasks/models/Task.model');
const User = require('../../user/models/User.model');
const { LEAD_STATUSES } = require('../../contacts/models/Contact.model');
const { DEAL_STAGES } = require('../../deals/models/Deal.model');
const XLSX = require('xlsx');

const reportService = {
  getDashboard: async (filters = {}) => {
    const dateFilter = {};
    if (filters.from) dateFilter.$gte = new Date(filters.from);
    if (filters.to) dateFilter.$lte = new Date(filters.to);
    const hasDate = Object.keys(dateFilter).length > 0;

    const contactQuery = { isActive: true };
    const dealQuery = { isActive: true };
    if (hasDate) { contactQuery.createdAt = dateFilter; dealQuery.createdAt = dateFilter; }

    const [
      totalContacts, totalDeals, totalTasks, wonDeals, lostDeals, openDeals,
      leadsByStatus, leadsBySource, dealsByStage, revenueByMonth, teamPerformance,
      recentDeals, overdueTasks,
    ] = await Promise.all([
      Contact.countDocuments(contactQuery),
      Deal.countDocuments(dealQuery),
      Task.countDocuments(hasDate ? { createdAt: dateFilter } : {}),
      Deal.countDocuments({ ...dealQuery, stage: 'won' }),
      Deal.countDocuments({ ...dealQuery, stage: 'lost' }),
      Deal.countDocuments({ ...dealQuery, stage: { $nin: ['won', 'lost'] } }),
      Contact.aggregate([{ $match: contactQuery }, { $group: { _id: '$leadStatus', count: { $sum: 1 } } }]),
      Contact.aggregate([{ $match: contactQuery }, { $group: { _id: '$leadSource', count: { $sum: 1 } } }]),
      Deal.aggregate([{ $match: dealQuery }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }]),
      Deal.aggregate([
        { $match: { ...dealQuery, stage: 'won' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }, revenue: { $sum: '$value' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Deal.aggregate([
        { $match: dealQuery },
        { $group: { _id: '$assignedTo', totalDeals: { $sum: 1 }, totalValue: { $sum: '$value' }, won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, totalDeals: 1, totalValue: 1, won: 1 } },
      ]),
      Deal.find(dealQuery).populate('assignedTo contact').sort('-updatedAt').limit(5),
      Task.find({ status: { $ne: 'done' }, dueDate: { $lt: new Date() } }).populate('assignedTo').limit(10),
    ]);

    const pipelineValue = await Deal.aggregate([
      { $match: { ...dealQuery, stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, total: { $sum: '$value' }, weighted: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } } } },
    ]);

    const conversionRate = totalContacts > 0 ? ((wonDeals / totalContacts) * 100).toFixed(1) : 0;

    return {
      summary: {
        totalContacts, totalDeals, totalTasks, wonDeals, lostDeals, openDeals,
        conversionRate: parseFloat(conversionRate),
        pipelineValue: pipelineValue[0]?.total || 0,
        forecastRevenue: pipelineValue[0]?.weighted || 0,
      },
      leadsByStatus: LEAD_STATUSES.map((s) => ({ status: s, count: leadsByStatus.find((l) => l._id === s)?.count || 0 })),
      leadsBySource: leadsBySource.map((l) => ({ source: l._id, count: l.count })),
      dealsByStage: DEAL_STAGES.map((s) => ({ stage: s, count: dealsByStage.find((d) => d._id === s)?.count || 0, value: dealsByStage.find((d) => d._id === s)?.value || 0 })),
      revenueByMonth,
      teamPerformance,
      recentDeals,
      overdueTasks,
    };
  },

  exportReport: async (filters = {}) => {
    const data = await reportService.getDashboard(filters);
    const wb = XLSX.utils.book_new();

    const summary = XLSX.utils.json_to_sheet([data.summary]);
    XLSX.utils.book_append_sheet(wb, summary, 'Summary');

    const leads = XLSX.utils.json_to_sheet(data.leadsByStatus);
    XLSX.utils.book_append_sheet(wb, leads, 'Leads');

    const deals = XLSX.utils.json_to_sheet(data.dealsByStage);
    XLSX.utils.book_append_sheet(wb, deals, 'Deals');

    const team = XLSX.utils.json_to_sheet(data.teamPerformance);
    XLSX.utils.book_append_sheet(wb, team, 'Team');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },
};

module.exports = reportService;
