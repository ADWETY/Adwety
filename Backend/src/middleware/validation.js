const { ZodError } = require('zod');
const { AppError } = require('../utils/error-handling');

module.exports = function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      req.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation failed', 422, error.flatten()));
        return;
      }
      next(error);
    }
  };
};
