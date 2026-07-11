const mongoose = require('mongoose');

const LEAD_SOURCES = ['website', 'referral', 'campaign', 'social', 'cold_call', 'event', 'other'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost', 'converted'];
const CONTACT_TYPES = ['lead', 'contact', 'customer'];

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  type: { type: String, enum: CONTACT_TYPES, default: 'lead' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  companyName: { type: String, default: '' },
  leadSource: { type: String, enum: LEAD_SOURCES, default: 'website' },
  leadStatus: { type: String, enum: LEAD_STATUSES, default: 'new' },
  tags: [{ type: String, trim: true }],
  segment: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  address: { type: String, default: '' },
  customFields: { type: Map, of: String, default: {} },
  lastActivityAt: { type: Date, default: Date.now },
  lastFollowUpAt: { type: Date },
  welcomeEmailSentAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

contactSchema.index({ email: 1 });
contactSchema.index({ leadStatus: 1 });
contactSchema.index({ leadSource: 1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ lastActivityAt: 1 });
contactSchema.index({ type: 1, lastActivityAt: 1 });

module.exports = mongoose.model('Contact', contactSchema);
module.exports.LEAD_SOURCES = LEAD_SOURCES;
module.exports.LEAD_STATUSES = LEAD_STATUSES;
module.exports.CONTACT_TYPES = CONTACT_TYPES;
