const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  storageKey: { type: String, required: true },
  url: { type: String, default: '' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: Number, default: 1 },
  parentDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  category: { type: String, default: 'general' },
}, { timestamps: true });

documentSchema.index({ contact: 1 });
documentSchema.index({ deal: 1 });

module.exports = mongoose.model('Document', documentSchema);
