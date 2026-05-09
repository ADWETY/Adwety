const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const { systemLog } = require('../services/logging.service');
function notFound(_req, _res, next) { next(new AppError('Route not found', 404)); }
function errorHandler(error, req, res, _next) { const status = error.statusCode || 500; if (status >= 500) systemLog({ type: 'error', action: 'system.error', success: false, message: error.message, metadata: { path: req.originalUrl, method: req.method }, ip: req.ip }); const production = ['production', 'staging'].includes(env.nodeEnv); res.status(status).json({ success: false, message: production && status >= 500 ? 'Internal server error' : error.message, details: production ? null : (error.details || null) }); }
module.exports = { notFound, errorHandler };
