import { successResponse } from '../../utils/response.js';
import { searchVocabularySchema } from './vocabulary.validator.js';
import * as service from './vocabulary.service.js';
import AppError from '../../utils/AppError.js';
import { VOCABULARY, COMMON } from '../../constants/codes/index.js';

export const searchVocabulary = async (req, res, next) => {
  try {
    const result = searchVocabularySchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const results = await service.searchSystemVocabularyService(result.data);
    return res
      .status(200)
      .json(successResponse(VOCABULARY.VOCAB_SEARCH_SUCCESS, results));
  } catch (error) {
    next(error);
  }
};