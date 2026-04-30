const mongoose = require('mongoose');
const { AppError } = require('./error-handling');

function makePagination(query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

function isValidObjectId(id) {
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

function validateObjectId(id, fieldName = 'id') {
  if (!isValidObjectId(id)) throw new AppError(`Invalid ${fieldName} format`, 400);
}

module.exports = { makePagination, isValidObjectId, validateObjectId };
