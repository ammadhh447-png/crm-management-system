const mongoose = require('mongoose');

const COMM_TYPES = ['email', 'call', 'meeting', 'note'];

const communicationSchema = new mongoose.Schema({
  type: { type: String, enum: COMM_TYPES, required: true },
  subject: { type: String, default: '' },
  body: { type: String, default: '' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
  duration: { type: Number, default: 0 },
  emailTo: { type: String, default: '' },
  emailStatus: { type: String, enum: ['draft', 'sent', 'failed'], default: 'sent' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

communicationSchema.index({ contact: 1, createdAt: -1 });
communicationSchema.index({ deal: 1 });

module.exports = mongoose.model('Communication', communicationSchema);
module.exports.COMM_TYPES = COMM_TYPES;
