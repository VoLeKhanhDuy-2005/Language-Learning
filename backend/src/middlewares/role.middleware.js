import AppError from '../utils/AppError.js';
import { COMMON } from '../constants/codes/index.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(COMMON.FORBIDDEN, 403));
    }
    next();
  };
};
