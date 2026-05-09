const mongoose = require('mongoose');
class AppError extends Error {
  constructor(message, statusCode = 400, details = null) { super(message); this.statusCode = statusCode; this.details = details; this.isOperational = true; }
}
function isValidObjectId(id) { return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id); }
function validateObjectId(id, field = 'id') { if (!isValidObjectId(id)) throw new AppError(`Invalid ${field} format`, 400); }
function pagination(query = {}) { const page = Math.max(1, Number(query.page || 1)); const limit = Math.min(100, Math.max(1, Number(query.limit || 20))); return { page, limit, skip: (page - 1) * limit }; }
function escapeRegex(value = '') { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
module.exports = { AppError, isValidObjectId, validateObjectId, pagination, escapeRegex };
