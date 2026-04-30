const { ZodError } = require('zod');
const env = require('../config/env');
const { AppError } = require('../utils/error-handling');

const SAFE_DEBUG_ENVS = new Set(['development', 'test']);

function normalizeZodIssues(error) {
  if (!SAFE_DEBUG_ENVS.has(env.nodeEnv)) return null;
  return error.issues.map((issue) => ({
    field: issue.path[issue.path.length - 1] || 'unknown',
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
