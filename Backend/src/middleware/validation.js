const { ZodError } = require('zod');
const env = require('../config/env');
const { AppError } = require('../utils/error-handling');

function normalizeZodIssues(error) {
  if (env.nodeEnv === 'production') return null;
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

module.exports = function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      req.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation failed', 422, normalizeZodIssues(error)));
        return;
      }
      next(error);
    }
  };
};
