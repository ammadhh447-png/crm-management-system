const Communication = require('../models/Communication.model');
const EmailTemplate = require('../models/EmailTemplate.model');
const { sendEmail: dispatchEmail } = require('../../../shared/utils/email');
const activityService = require('../../activity/services/activity.service');
const automationService = require('../../automation/services/automation.service');
const AppError = require('../../../shared/errors/AppError');
const { parsePagination } = require('../../../shared/utils/pagination');

const optionalObjectId = (value) => {
  if (!value || (typeof value === 'string' && !value.trim())) return undefined;
  return value;
};

const buildCommunicationRecord = ({ type, subject, body, contactId, dealId, userId, to, emailStatus }) => {
  const record = {
    type,
    subject: subject || '',
    body: body || '',
    userId,
    direction: 'outbound',
    emailStatus,
  };

  const contact = optionalObjectId(contactId);
  const deal = optionalObjectId(dealId);
  if (contact) record.contact = contact;
  if (deal) record.deal = deal;
  if (to) record.emailTo = to;

  return record;
};

const communicationService = {
  create: async (data, req) => {
    const comm = await Communication.create({
      type: data.type,
      subject: data.subject || '',
      body: data.body || '',
      contact: optionalObjectId(data.contact),
      deal: optionalObjectId(data.deal),
      duration: data.duration || 0,
      userId: req.user._id,
      direction: data.direction || 'outbound',
    });
    if (data.contact) await automationService.touchContactActivity(data.contact);
    await activityService.log({
      userId: req.user._id, action: 'create', module: 'communications',
      description: `${data.type} logged`, targetId: comm._id.toString(), targetType: 'communication', req,
    });
    return comm.populate(['contact', 'deal', 'userId']);
  },

  getAll: async (filters = {}, options = {}) => {
    const { limit, skip, buildMeta } = parsePagination(options);
    const query = {};
    if (filters.contact) query.contact = filters.contact;
    if (filters.deal) query.deal = filters.deal;
    if (filters.type) query.type = filters.type;
    if (filters.search) {
      query.$or = [
        { subject: { $regex: filters.search, $options: 'i' } },
        { body: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [communications, total] = await Promise.all([
      Communication.find(query).populate('contact deal userId').sort('-createdAt').skip(skip).limit(limit),
      Communication.countDocuments(query),
    ]);
    return { communications, pagination: buildMeta(total) };
  },

  sendEmail: async ({ to, subject, body, contactId, dealId, templateId }, req) => {
    if (!to?.trim()) throw new AppError('Recipient email is required', 400);

    let emailBody = body;
    let emailSubject = subject;

    if (optionalObjectId(templateId)) {
      const template = await EmailTemplate.findById(templateId);
      if (template) {
        emailBody = template.body;
        emailSubject = template.subject;
      }
    }

    const record = buildCommunicationRecord({
      type: 'email',
      subject: emailSubject,
      body: emailBody,
      contactId,
      dealId,
      userId: req.user._id,
      to: to.trim(),
      emailStatus: 'sent',
    });

    try {
      await dispatchEmail({
        to: to.trim(),
        subject: emailSubject,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px">${emailBody}</div>`,
      });
    } catch (err) {
      await Communication.create({ ...record, emailStatus: 'failed' });
      throw err;
    }

    const comm = await Communication.create(record);

    if (optionalObjectId(contactId)) {
      await automationService.touchContactActivity(contactId);
    }

    return comm.populate(['contact', 'deal']);
  },

  getTemplates: async () => EmailTemplate.find({ isActive: true }).sort('name'),

  createTemplate: async (data, req) => {
    return EmailTemplate.create({ ...data, createdBy: req.user._id });
  },

  updateTemplate: async (id, data) => {
    return EmailTemplate.findByIdAndUpdate(id, data, { new: true });
  },

  deleteTemplate: async (id) => {
    return EmailTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
  },

  deleteById: async (id, req) => {
    const comm = await Communication.findById(id);
    if (!comm) throw new AppError('Communication not found', 404);

    await Communication.findByIdAndDelete(id);

    await activityService.log({
      userId: req.user._id,
      action: 'delete',
      module: 'communications',
      description: `${comm.type} communication deleted`,
      targetId: id,
      targetType: 'communication',
      req,
    });

    return { message: 'Communication deleted' };
  },

  deleteMany: async (ids, req) => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new AppError('No communications selected', 400);
    }

    const communications = await Communication.find({ _id: { $in: ids } });
    if (!communications.length) throw new AppError('No communications found', 404);

    await Communication.deleteMany({ _id: { $in: ids } });

    await activityService.log({
      userId: req.user._id,
      action: 'delete',
      module: 'communications',
      description: `${communications.length} communication(s) deleted`,
      metadata: { count: communications.length },
      req,
    });

    return { deleted: communications.length };
  },
};

module.exports = communicationService;
