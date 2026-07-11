const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  companyName: { type: String, default: 'CRM System' },
  companyEmail: { type: String, default: '' },
  companyPhone: { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  customContactFields: [{
    name: String,
    label: String,
    type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' },
    options: [String],
    required: { type: Boolean, default: false },
  }],
  customDealFields: [{
    name: String,
    label: String,
    type: { type: String, enum: ['text', 'number', 'date', 'select'], default: 'text' },
    options: [String],
    required: { type: Boolean, default: false },
  }],
  defaultLanguage: { type: String, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
