const mongoose = require('mongoose');
const env = require('./env');

module.exports = async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { autoIndex: true });
  console.log('MongoDB connected');
};
