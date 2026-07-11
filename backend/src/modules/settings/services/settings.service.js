const Settings = require('../models/Settings.model');
const AppError = require('../../../shared/errors/AppError');

const DEFAULT_KEY = 'global';

const settingsService = {
  get: async () => {
    let settings = await Settings.findOne({ key: DEFAULT_KEY });
    if (!settings) {
      settings = await Settings.create({ key: DEFAULT_KEY });
    }
    return settings;
  },

  update: async (data, req) => {
    const settings = await Settings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      data,
      { new: true, upsert: true, runValidators: true }
    );
    return settings;
  },

  addCustomField: async (entity, field) => {
    const key = entity === 'deal' ? 'customDealFields' : 'customContactFields';
    const settings = await settingsService.get();
    settings[key].push(field);
    await settings.save();
    return settings;
  },

  removeCustomField: async (entity, fieldName) => {
    const key = entity === 'deal' ? 'customDealFields' : 'customContactFields';
    const settings = await settingsService.get();
    settings[key] = settings[key].filter((f) => f.name !== fieldName);
    await settings.save();
    return settings;
  },
};

module.exports = settingsService;
