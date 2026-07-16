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

    const results = await service.searchSystemVocabularyService(
      result.data,
      req.user.id
    );
    return res
      .status(200)
      .json(successResponse(VOCABULARY.VOCAB_SEARCH_SUCCESS, results));
  } catch (error) {
    next(error);
  }
};

export const getUserCardStates = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { starred, hidden } = req.query;

    const results = await service.getUserCardStatesService(req.user.id, {
      starred,
      hidden,
      page,
      limit,
    });

    return res
      .status(200)
      .json(successResponse(VOCABULARY.VOCAB_SEARCH_SUCCESS, results));
  } catch (error) {
    next(error);
  }
};
