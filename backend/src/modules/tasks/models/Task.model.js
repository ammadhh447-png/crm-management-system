const mongoose = require('mongoose');

const TASK_TYPES = ['call', 'meeting', 'follow_up', 'email', 'other'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TASK_STATUSES = ['pending', 'in_progress', 'done', 'cancelled'];
const RECURRENCE = ['none', 'daily', 'weekly', 'monthly'];

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: TASK_TYPES, default: 'follow_up' },
  priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
  status: { type: String, enum: TASK_STATUSES, default: 'pending' },
  dueDate: { type: Date },
  reminderAt: { type: Date },
  recurrence: { type: String, enum: RECURRENCE, default: 'none' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  completedAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
module.exports.TASK_TYPES = TASK_TYPES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
module.exports.TASK_STATUSES = TASK_STATUSES;
