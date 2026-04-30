const env = require('../config/env');

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function notFoundHandler(_req, _res, next) {
  next(new AppError('Route not found', 404));
}

function globalErrorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const isProduction = env.nodeEnv === 'production';
  const safeMessage = statusCode >= 500 && isProduction ? 'Internal server error' : (error.message || 'Internal server error');

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    details: !isProduction && error.details ? error.details : null,
  });
}

module.exports = { AppError, notFoundHandler, globalErrorHandler };
