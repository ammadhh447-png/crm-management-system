const mongoose = require('mongoose');
const { mongodbUri } = require('./env');

const connectDatabase = async () => {
  await mongoose.connect(mongodbUri);
};

module.exports = { connectDatabase };
