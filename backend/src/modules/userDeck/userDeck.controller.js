import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { USER_DECK, COMMON } from '../../constants/codes/index.js';
import {
  createDeckSchema,
  updateDeckSchema,
  listMyDecksSchema,
  deckIdParamSchema,
  topicIdParamSchema,
  createTopicSchema,
  updateTopicSchema,
  cardIdParamSchema,
  listCardsSchema,
  createCardSchema,
  updateCardSchema,
} from './userDeck.validator.js';
import * as service from './userDeck.service.js';
import * as importExportService from '../deck/importExport.service.js';

export const listMyDeckCards = async (req, res, next) => {
  try {
    const paramResult = deckIdParamSchema.safeParse(req.params);
    const queryResult = listCardsSchema.safeParse(req.query);

    if (!paramResult.success || !queryResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(queryResult.success ? [] : queryResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const data = await service.listMyDeckCards(
      req.user.id,
      paramResult.data.deckId,
      queryResult.data
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.CARD_LIST_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const getMyDeckCard = async (req, res, next) => {
  try {
    const result = cardIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const card = await service.getMyDeckCard(
      req.user.id,
      result.data.deckId,
      result.data.cardId
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.CARD_DETAIL_SUCCESS, card));
  } catch (error) {
    next(error);
  }
};

export const updateMyDeckCard = async (req, res, next) => {
  try {
    const paramResult = cardIdParamSchema.safeParse(req.params);
    const bodyResult = updateCardSchema.safeParse(req.body);

    if (!paramResult.success || !bodyResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(bodyResult.success ? [] : bodyResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const card = await service.updateMyDeckCard(
      req.user.id,
      paramResult.data.deckId,
      paramResult.data.cardId,
      bodyResult.data
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.CARD_UPDATE_SUCCESS, card));
  } catch (error) {
    next(error);
  }
};

export const deleteMyDeckCard = async (req, res, next) => {
  try {
    const result = cardIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    await service.deleteMyDeckCard(
      req.user.id,
      result.data.deckId,
      result.data.cardId
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.CARD_DELETE_SUCCESS, null));
  } catch (error) {
    next(error);
  }
};

export const createMyDeckCard = async (req, res, next) => {
  try {
    const paramResult = deckIdParamSchema.safeParse(req.params);
    const bodyResult = createCardSchema.safeParse(req.body);

    if (!paramResult.success || !bodyResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(bodyResult.success ? [] : bodyResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const card = await service.createMyDeckCard(
      req.user.id,
      paramResult.data.deckId,
      bodyResult.data
    );

    return res
      .status(201)
      .json(successResponse(USER_DECK.CARD_CREATE_SUCCESS, card));
  } catch (error) {
    next(error);
  }
};

export const getMyDeckTopics = async (req, res, next) => {
  try {
    const result = deckIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const data = await service.getMyDeckTopics(req.user.id, result.data.deckId);

    return res
      .status(200)
      .json(successResponse(USER_DECK.TOPIC_LIST_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const getMyDeckTopic = async (req, res, next) => {
  try {
    const result = topicIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const topic = await service.getMyDeckTopic(
      req.user.id,
      result.data.deckId,
      result.data.topicId
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.TOPIC_DETAIL_SUCCESS, topic));
  } catch (error) {
    next(error);
  }
};

export const updateMyDeckTopic = async (req, res, next) => {
  try {
    const paramResult = topicIdParamSchema.safeParse(req.params);
    const bodyResult = updateTopicSchema.safeParse(req.body);

    if (!paramResult.success || !bodyResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(bodyResult.success ? [] : bodyResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const topic = await service.updateMyDeckTopic(
      req.user.id,
      paramResult.data.deckId,
      paramResult.data.topicId,
      bodyResult.data
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.TOPIC_UPDATE_SUCCESS, topic));
  } catch (error) {
    next(error);
  }
};

export const deleteMyDeckTopic = async (req, res, next) => {
  try {
    const result = topicIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    await service.deleteMyDeckTopic(
      req.user.id,
      result.data.deckId,
      result.data.topicId
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.TOPIC_DELETE_SUCCESS, null));
  } catch (error) {
    next(error);
  }
};

export const createMyDeckTopic = async (req, res, next) => {
  try {
    const paramResult = deckIdParamSchema.safeParse(req.params);
    const bodyResult = createTopicSchema.safeParse(req.body);

    if (!paramResult.success || !bodyResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(bodyResult.success ? [] : bodyResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const topic = await service.createMyDeckTopic(
      req.user.id,
      paramResult.data.deckId,
      bodyResult.data
    );

    return res
      .status(201)
      .json(successResponse(USER_DECK.TOPIC_CREATE_SUCCESS, topic));
  } catch (error) {
    next(error);
  }
};

export const deleteMyDeck = async (req, res, next) => {
  try {
    const result = deckIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    await service.deleteMyDeck(req.user.id, result.data.deckId);

    return res
      .status(200)
      .json(successResponse(USER_DECK.DECK_DELETE_SUCCESS, null));
  } catch (error) {
    next(error);
  }
};

export const updateMyDeck = async (req, res, next) => {
  try {
    const paramResult = deckIdParamSchema.safeParse(req.params);
    const bodyResult = updateDeckSchema.safeParse(req.body);

    if (!paramResult.success || !bodyResult.success) {
      const errors = [
        ...(paramResult.success ? [] : paramResult.error.errors),
        ...(bodyResult.success ? [] : bodyResult.error.errors),
      ].map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const deck = await service.updateMyDeck(
      req.user.id,
      paramResult.data.deckId,
      bodyResult.data
    );

    return res
      .status(200)
      .json(successResponse(USER_DECK.DECK_UPDATE_SUCCESS, deck));
  } catch (error) {
    next(error);
  }
};

export const getMyDeckById = async (req, res, next) => {
  try {
    const result = deckIdParamSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const deck = await service.getMyDeckById(req.user.id, result.data.deckId);

    return res
      .status(200)
      .json(successResponse(USER_DECK.DECK_DETAIL_SUCCESS, deck));
  } catch (error) {
    next(error);
  }
};

export const listMyDecks = async (req, res, next) => {
  try {
    const result = listMyDecksSchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const data = await service.listMyDecks(req.user.id, result.data);

    return res
      .status(200)
      .json(successResponse(USER_DECK.MY_DECK_LIST_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const createDeck = async (req, res, next) => {
  try {
    const result = createDeckSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const deck = await service.createDeck(req.user.id, result.data);

    return res
      .status(201)
      .json(successResponse(USER_DECK.DECK_CREATE_SUCCESS, deck));
  } catch (error) {
    next(error);
  }
};

export const exportCards = async (req, res, next) => {
  try {
    const { deckId, topicId } = req.params;
    const userId = req.user.id;
    const buffer = await importExportService.userExportCards(userId, deckId, topicId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cards_${topicId}.xlsx"`
    );
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const importCards = async (req, res, next) => {
  try {
    const { deckId, topicId } = req.params;
    const { fileUrl, mode } = req.body;
    const userId = req.user.id;
    const result = await importExportService.userImportCards(
      userId,
      deckId,
      topicId,
      fileUrl,
      mode
    );
    return res
      .status(200)
      .json(successResponse(USER_DECK.CARD_IMPORT_SUCCESS, result));
  } catch (error) {
    next(error);
  }
};