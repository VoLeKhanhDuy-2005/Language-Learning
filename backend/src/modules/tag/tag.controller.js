import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { TAG, COMMON } from '../../constants/codes/index.js';
import { listTagsSchema } from './tag.validator.js';
import * as service from './tag.service.js';

export const listTags = async (req, res, next) => {
  try {
    const result = listTagsSchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const tags = await service.listTags(result.data);
    return res.status(200).json(successResponse(TAG.TAG_LIST_SUCCESS, tags));
  } catch (error) {
    next(error);
  }
};
