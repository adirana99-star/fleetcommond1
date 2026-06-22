const mongoose = require('mongoose');
const { config } = require('./config');

async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not set. Update backend/.env before starting the server.');
  }

  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 10000
  });
}

module.exports = { connectDatabase };
