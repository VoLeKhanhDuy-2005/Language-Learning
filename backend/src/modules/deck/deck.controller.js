import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { DECK, COMMON } from '../../constants/codes/index.js';
import {
  getDeckSchema,
  getTopicCardsSchema,
  listDecksSchema,
} from './deck.validator.js';
import * as service from './deck.service.js';

export const getDeckById = async (req, res, next) => {
  try {
    const result = getDeckSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user.id;
    const deck = await service.getDeckById(result.data.deckId, userId);

    return res
      .status(200)
      .json(successResponse(DECK.DECK_DETAIL_SUCCESS, deck));
  } catch (error) {
    next(error);
  }
};

export const getDeckTopics = async (req, res, next) => {
  try {
    const result = getDeckSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user.id;
    const data = await service.getDeckTopics(result.data.deckId, userId);

    return res
      .status(200)
      .json(successResponse(DECK.DECK_TOPICS_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const getTopicCards = async (req, res, next) => {
  try {
    const result = getTopicCardsSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user.id;
    const { deckId, topicId } = result.data;
    const data = await service.getTopicCards(deckId, topicId, userId);

    return res
      .status(200)
      .json(successResponse(DECK.TOPIC_CARDS_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const listDecks = async (req, res, next) => {
  try {
    const result = listDecksSchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user?.id ?? null;
    const data = await service.listDecks(result.data, userId);

    return res.status(200).json(successResponse(DECK.DECK_LIST_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};
