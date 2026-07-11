const { ZodError } = require('zod');
const AppError = require('../shared/errors/AppError');

const formatZodError = (error) => {
  if (!(error instanceof ZodError)) return error.message;
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
};

const validateZod = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    next(new AppError(formatZodError(error), 400));
  }
};

module.exports = validateZod;
