const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const { systemLog } = require('../services/logging.service');

function notFound(_req, _res, next) {
  next(new AppError('Route not found', 404));
}

function normalizeMongoError(error) {
  if (error?.code !== 11000) return error;
  const fields = Object.keys(error.keyPattern || error.keyValue || {});
  const label = fields.includes('number') ? 'Document number' : (fields[0] || 'Value');
  return new AppError(`${label} already exists`, 409, {
    code: 'DUPLICATE_KEY',
    fields,
  });
}

function errorHandler(rawError, req, res, _next) {
  const error = normalizeMongoError(rawError);
  const status = error.statusCode || 500;
  if (status >= 500) {
    systemLog({
      type: 'error',
      action: 'system.error',
      success: false,
      message: error.message,
      metadata: { path: req.originalUrl, method: req.method },
      ip: req.ip,
    });
  }
  const production = ['production', 'staging'].includes(env.nodeEnv);
  res.status(status).json({
    success: false,
    message: production && status >= 500 ? 'Internal server error' : error.message,
    details: production && status >= 500 ? null : (error.details || null),
  });
}

module.exports = { notFound, errorHandler, normalizeMongoError };
