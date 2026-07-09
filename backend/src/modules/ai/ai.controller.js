import * as aiService from '../ai/ai.service.js';
import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { COMMON, AI } from '../../constants/codes/index.js';

export const responseQuestion = async (req, res, next) => {
  try {
    const {
      question,
      mode = 'minlish',
      language = 'vi',
      conversationId,
    } = req.body;
    const userId = req.user._id;
    const data = await aiService.responseQuestionService(
      question,
      mode,
      language,
      conversationId || null,
      userId
    );
    return res.status(200).json(successResponse(AI.AI_RESPONSE_SUCCESS, data));
  } catch (err) {
    next(err);
  }
};

export const autoFillCard = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word) {
      throw new AppError(COMMON.INVALID_DATA, 400, [
        { field: 'word', message: 'The word field is required' },
      ]);
    }
    const data = await aiService.generateCardDetailsFromAI(word);
    return res
      .status(200)
      .json(successResponse(AI.CARD_AUTO_FILL_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

// Conversation History
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = await aiService.getConversationsService(userId);
    return res
      .status(200)
      .json(successResponse(AI.CONVERSATIONS_FETCHED, data));
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const data = await aiService.getConversationByIdService(
      conversationId,
      userId
    );
    return res.status(200).json(successResponse(AI.CONVERSATION_FETCHED, data));
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = await aiService.createConversationService(userId);
    return res.status(201).json(successResponse(AI.CONVERSATION_CREATED, data));
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    await aiService.deleteConversationService(conversationId, userId);
    return res.status(200).json(successResponse(AI.CONVERSATION_DELETED, null));
  } catch (err) {
    next(err);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { title } = req.body;
    if (!title) throw new AppError(COMMON.INVALID_DATA, 400);
    const data = await aiService.renameConversationService(
      conversationId,
      userId,
      title
    );
    return res.status(200).json(successResponse(AI.CONVERSATION_UPDATED, data));
  } catch (err) {
    next(err);
  }
};
