import { successResponse } from '../../utils/response.js';
import AppError from '../../utils/AppError.js';
import { LESSON, COMMON } from '../../constants/codes/index.js';
import {
  getLessonSchema,
  listLessonsSchema,
  getSegmentsSchema,
  getSegmentSchema,
} from './lesson.validator.js';
import * as service from './lesson.service.js';

export const listLessons = async (req, res, next) => {
  try {
    const result = listLessonsSchema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user?.id ?? null;
    const data = await service.listLessons(result.data, userId);

    return res
      .status(200)
      .json(successResponse(LESSON.LESSON_LIST_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const result = getLessonSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user?.id ?? null;
    const data = await service.getLessonById(result.data.lessonId, userId);

    return res
      .status(200)
      .json(successResponse(LESSON.LESSON_DETAIL_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export const getSegments = async (req, res, next) => {
  try {
    const result = getSegmentsSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user?.id ?? null;
    const data = await service.getSegmentsByLessonId(
      result.data.lessonId,
      userId
    );

    return res
      .status(200)
      .json(successResponse(LESSON.SEGMENT_LIST_SUCCESS, data));
  } catch (err) {
    next(err);
  }
};

export const getSegmentById = async (req, res, next) => {
  try {
    const result = getSegmentSchema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(COMMON.INVALID_DATA, 400, errors));
    }

    const userId = req.user?.id ?? null;
    const { lessonId, segmentId } = result.data;
    const data = await service.getSegmentById(lessonId, segmentId, userId);

    return res
      .status(200)
      .json(successResponse(LESSON.SEGMENT_DETAIL_SUCCESS, data));
  } catch (err) {
    next(err);
  }
};
