const { ZodError } = require('zod');
const { AppError } = require('../utils/helpers');
module.exports = function validate(schema) {
  return (req, _res, next) => {
    try { req.validated = schema.parse({ body: req.body, query: req.query, params: req.params }); return next(); }
    catch (error) {
      if (error instanceof ZodError) return next(new AppError('Validation failed', 422, error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))));
      return next(error);
    }
  };
};
