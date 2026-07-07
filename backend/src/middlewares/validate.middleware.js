import AppError from '../utils/AppError.js';
import { COMMON } from '../constants/codes/index.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(new AppError(COMMON.INVALID_DATA, 400, errors));
  }
  req.body = result.data;
  next();
};

export default validate;
