const mongoose = require('mongoose');
const env = require('../src/config/env');

module.exports = async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
};
