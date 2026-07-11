const Contact = require('../models/Contact.model');
const Company = require('../models/Company.model');
const activityService = require('../../activity/services/activity.service');
const automationService = require('../../automation/services/automation.service');
const AppError = require('../../../shared/errors/AppError');
const { parsePagination } = require('../../../shared/utils/pagination');
const csv = require('csv-parser');
const { Readable } = require('stream');
const XLSX = require('xlsx');

const contactService = {
  create: async (data, req) => {
    const duplicate = await Contact.findOne({ email: data.email.toLowerCase(), isActive: true });
    if (duplicate) throw new AppError('Contact with this email already exists', 409);

    let company = null;
    if (data.companyName && !data.company) {
      company = await Company.create({ name: data.companyName, createdBy: req.user._id });
      data.company = company._id;
    }

    const contact = await Contact.create({
      ...data,
      createdBy: req.user._id,
      lastActivityAt: new Date(),
    });

    await activityService.log({
      userId: req.user._id, action: 'create', module: 'contacts',
      description: `Contact created: ${contact.fullName}`, targetId: contact._id.toString(), targetType: 'contact', req,
    });

    if (contact.assignedTo) {
      await automationService.notifyLeadAssigned(contact, contact.assignedTo, req.user._id);
    }

    let welcomeEmail = null;

    if (contact.type === 'customer') {
      welcomeEmail = await automationService.sendCustomerWelcomeEmail(contact, req);
    }

    const populated = await contact.populate(['company', 'assignedTo', 'createdBy']);
    return { contact: populated, welcomeEmail };
  },

  getAll: async (filters = {}, options = {}) => {
    const { page, limit, skip, buildMeta } = parsePagination(options);
    const query = { isActive: true };
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.leadStatus) query.leadStatus = filters.leadStatus;
    if (filters.leadSource) query.leadSource = filters.leadSource;
    if (filters.type) query.type = filters.type;
    if (filters.tag) query.tags = filters.tag;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    const [contacts, total] = await Promise.all([
      Contact.find(query).populate('company assignedTo').sort('-createdAt').skip(skip).limit(limit),
      Contact.countDocuments(query),
    ]);
    return { contacts, pagination: buildMeta(total) };
  },

  getById: async (id) => {
    const contact = await Contact.findById(id).populate('company assignedTo createdBy');
    if (!contact || !contact.isActive) throw new AppError('Contact not found', 404);
    return contact;
  },

  update: async (id, data, req) => {
    const existing = await Contact.findById(id);
    if (!existing || !existing.isActive) throw new AppError('Contact not found', 404);

    const contact = await Contact.findByIdAndUpdate(
      id,
      { ...data, lastActivityAt: new Date() },
      { new: true, runValidators: true }
    ).populate('company assignedTo');

    await activityService.log({
      userId: req.user._id, action: 'update', module: 'contacts',
      description: `Contact updated: ${contact.fullName}`, targetId: id, targetType: 'contact', req,
    });

    const newAssignee = data.assignedTo?.toString();
    const oldAssignee = existing.assignedTo?.toString();
    if (newAssignee && newAssignee !== oldAssignee) {
      await automationService.notifyLeadAssigned(contact, contact.assignedTo, req.user._id);
    }

    const populated = await contact.populate(['company', 'assignedTo', 'createdBy']);

    let welcomeEmail = null;
    if (data.type === 'customer' && existing.type !== 'customer') {
      welcomeEmail = await automationService.sendCustomerWelcomeEmail(populated, req);
    }

    return { contact: populated, welcomeEmail };
  },

  delete: async (id, req) => {
    const contact = await Contact.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!contact) throw new AppError('Contact not found', 404);
    await activityService.log({
      userId: req.user._id, action: 'delete', module: 'contacts',
      description: `Contact deleted: ${contact.fullName}`, targetId: id, targetType: 'contact', req,
    });
    return { message: 'Contact deleted' };
  },

  deleteMany: async (ids, req) => {
    if (!Array.isArray(ids) || !ids.length) throw new AppError('No contacts selected', 400);

    const contacts = await Contact.find({ _id: { $in: ids }, isActive: true });
    if (!contacts.length) throw new AppError('No contacts found', 404);

    await Contact.updateMany({ _id: { $in: ids } }, { isActive: false });

    await activityService.log({
      userId: req.user._id,
      action: 'delete',
      module: 'contacts',
      description: `${contacts.length} contact(s) deleted`,
      metadata: { count: contacts.length },
      req,
    });

    return { deleted: contacts.length };
  },

  findDuplicates: async () => {
    const contacts = await Contact.find({ isActive: true }, 'firstName lastName email phone');
    const duplicates = [];
    const seen = {};
    contacts.forEach((c) => {
      const key = c.email.toLowerCase();
      if (seen[key]) duplicates.push({ original: seen[key], duplicate: c });
      else seen[key] = c;
    });
    return duplicates;
  },

  importCSV: async (buffer, req) => {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());
      stream.pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', async () => {
          try {
            const created = [];
            for (const row of results) {
              const exists = await Contact.findOne({ email: (row.email || '').toLowerCase(), isActive: true });
              if (!exists && row.email) {
                const contact = await Contact.create({
                  firstName: row.firstName || row.first_name || 'Unknown',
                  lastName: row.lastName || row.last_name || '',
                  email: row.email,
                  phone: row.phone || '',
                  companyName: row.company || row.companyName || '',
                  leadSource: row.leadSource || 'website',
                  leadStatus: row.leadStatus || 'new',
                  createdBy: req.user._id,
                  lastActivityAt: new Date(),
                });
                created.push(contact);
              }
            }
            resolve({ imported: created.length, total: results.length });
          } catch (err) { reject(err); }
        })
        .on('error', reject);
    });
  },

  exportData: async (format = 'csv') => {
    const contacts = await Contact.find({ isActive: true }).populate('company assignedTo').lean();
    const rows = contacts.map((c) => ({
      firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
      company: c.companyName || c.company?.name || '', leadSource: c.leadSource,
      leadStatus: c.leadStatus, tags: (c.tags || []).join(';'), segment: c.segment,
    }));

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    const headers = Object.keys(rows[0] || { firstName: '', lastName: '', email: '' });
    const csvContent = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${r[h] || ''}"`).join(','))].join('\n');
    return Buffer.from(csvContent);
  },

  getCompanies: async (search) => {
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    return Company.find(query).sort('name').limit(50);
  },

  createCompany: async (data, req) => {
    return Company.create({ ...data, createdBy: req.user._id });
  },
};

module.exports = contactService;
