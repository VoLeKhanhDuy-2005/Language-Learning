import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { FILE, COMMON } from '../../constants/codes/index.js';
import { presignedUrlSchema } from './file.validator.js';
import * as service from './file.service.js';

const ADMIN_ONLY_PURPOSES = ['card-image'];

export const createPresignedUrl = async (req, res, next) => {
  try {
    const result = presignedUrlSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    if (
      ADMIN_ONLY_PURPOSES.includes(result.data.purpose) &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError(COMMON.FORBIDDEN, 403));
    }

    const data = await service.createUploadPresignedUrl(
      result.data,
      req.user.id
    );

    return res
      .status(200)
      .json(successResponse(FILE.PRESIGNED_URL_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};
