import { successResponse } from '../../utils/response.js';
import { CEFR } from '../../constants/codes/index.js';
import * as service from './cefrLevel.service.js';

export const listCefrLevels = async (req, res, next) => {
  try {
    const levels = await service.listCefrLevels();
    return res
      .status(200)
      .json(successResponse(CEFR.CEFR_LIST_SUCCESS, levels));
  } catch (error) {
    next(error);
  }
};
