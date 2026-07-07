import * as userService from './user.service.js';
import AppError from '../../utils/AppError.js';
import {
  COMMON,
  USER_CARD_STATE,
  USER_SEGMENT_PROGRESS,
  MESSAGES,
  USER,
} from '../../constants/codes/index.js';
import {
  getLessonSegmentsProgressSchema,
  getSegmentProgressSchema,
  updateSegmentProgressSchema,
  getCardStatesSchema,
  getCardStateSchema,
  patchCardStateSchema,
  updateProfileSchema,
} from './user.validator.js';

export const getLessonSegmentsProgress = async (req, res, next) => {
  try {
    const result = getLessonSegmentsProgressSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const { lessonId } = result.data;
    const userId = req.user.id;
    const progressList = await userService.getLessonSegmentsProgress(
      userId,
      lessonId
    );
    res.status(200).json({
      success: true,
      code: USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_LIST_SUCCESS,
      message: MESSAGES[USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_LIST_SUCCESS],
      data: progressList,
    });
  } catch (error) {
    next(error);
  }
};

export const getSegmentProgress = async (req, res, next) => {
  try {
    const result = getSegmentProgressSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const { lessonId, segmentId } = result.data;
    const userId = req.user.id;
    const progress = await userService.getSegmentProgress(
      userId,
      lessonId,
      segmentId
    );
    res.status(200).json({
      success: true,
      code: USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_DETAIL_SUCCESS,
      message: MESSAGES[USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_DETAIL_SUCCESS],
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSegmentProgress = async (req, res, next) => {
  try {
    const paramsResult = updateSegmentProgressSchema.shape.params.safeParse(
      req.params
    );
    const bodyResult = updateSegmentProgressSchema.shape.body.safeParse(
      req.body
    );

    if (!paramsResult.success || !bodyResult.success) {
      const errors = [];
      if (!paramsResult.success) {
        errors.push(
          ...paramsResult.error.errors.map((e) => ({
            field: 'params.' + e.path.join('.'),
            message: e.message,
          }))
        );
      }
      if (!bodyResult.success) {
        errors.push(
          ...bodyResult.error.errors.map((e) => ({
            field: 'body.' + e.path.join('.'),
            message: e.message,
          }))
        );
      }
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const { lessonId, segmentId } = paramsResult.data;
    const data = bodyResult.data;
    const userId = req.user.id;
    const progress = await userService.updateSegmentProgress(
      userId,
      lessonId,
      segmentId,
      data
    );
    res.status(200).json({
      success: true,
      code: USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_UPDATE_SUCCESS,
      message: MESSAGES[USER_SEGMENT_PROGRESS.SEGMENT_PROGRESS_UPDATE_SUCCESS],
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const getCardStates = async (req, res, next) => {
  try {
    const result = getCardStatesSchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user.id;
    const { data, pagination } = await userService.getCardStates(
      userId,
      result.data
    );
    res.status(200).json({
      success: true,
      code: USER_CARD_STATE.CARD_STATE_LIST_SUCCESS,
      message: MESSAGES[USER_CARD_STATE.CARD_STATE_LIST_SUCCESS],
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCardState = async (req, res, next) => {
  try {
    const result = getCardStateSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const { cardId } = result.data;
    const userId = req.user.id;
    const cardState = await userService.getCardState(userId, cardId);

    res.status(200).json({
      success: true,
      code: USER_CARD_STATE.CARD_STATE_DETAIL_SUCCESS,
      message: MESSAGES[USER_CARD_STATE.CARD_STATE_DETAIL_SUCCESS],
      data: cardState,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertCardState = async (req, res, next) => {
  try {
    const paramsResult = patchCardStateSchema.shape.params.safeParse(
      req.params
    );
    const bodyResult = patchCardStateSchema.shape.body.safeParse(req.body);

    if (!paramsResult.success || !bodyResult.success) {
      const errors = [];
      if (!paramsResult.success) {
        errors.push(
          ...paramsResult.error.errors.map((e) => ({
            field: 'params.' + e.path.join('.'),
            message: e.message,
          }))
        );
      }
      if (!bodyResult.success) {
        errors.push(
          ...bodyResult.error.errors.map((e) => ({
            field: 'body.' + e.path.join('.'),
            message: e.message,
          }))
        );
      }
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const { cardId } = paramsResult.data;
    const userId = req.user.id;
    const cardState = await userService.upsertCardState(
      userId,
      cardId,
      bodyResult.data
    );

    res.status(200).json({
      success: true,
      code: USER_CARD_STATE.CARD_STATE_UPSERT_SUCCESS,
      message: MESSAGES[USER_CARD_STATE.CARD_STATE_UPSERT_SUCCESS],
      data: cardState,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user.id;
    const data = result.data;
    const profile = await userService.updateProfile(userId, data);
    res.status(200).json({
      success: true,
      code: USER.PROFILE_UPDATE_SUCCESS,
      message: MESSAGES[USER.PROFILE_UPDATE_SUCCESS],
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await userService.getUserStats(userId);
    res.status(200).json({
      success: true,
      code: USER.STATS_GET_SUCCESS,
      message: MESSAGES[USER.STATS_GET_SUCCESS],
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
