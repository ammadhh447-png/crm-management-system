const mongoose = require('mongoose');

const DEAL_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  value: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  probability: { type: Number, min: 0, max: 100, default: 10 },
  stage: { type: String, enum: DEAL_STAGES, default: 'prospect' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expectedCloseDate: { type: Date },
  description: { type: String, default: '' },
  lostReason: { type: String, default: '' },
  customFields: { type: Map, of: String, default: {} },
  history: [{
    action: String,
    from: String,
    to: String,
    note: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

dealSchema.index({ stage: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ expectedCloseDate: 1 });

module.exports = mongoose.model('Deal', dealSchema);
module.exports.DEAL_STAGES = DEAL_STAGES;
