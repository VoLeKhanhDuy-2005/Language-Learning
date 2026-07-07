import AppError from '../../utils/AppError.js';
import {
  LESSON,
  ADMIN,
  MESSAGES,
  COMMON,
} from '../../constants/codes/index.js';
import LessonSegment from '../../models/lessonSegment.model.js';
import Lesson from '../../models/lesson.model.js';
import UserLessonProgress from '../../models/userLessonProgress.model.js';
import UserSegmentProgress from '../../models/userSegmentProgress.model.js';
import { generateSlug } from '../../utils/generate.js';
import { getDurationMsFromYoutube } from '../../utils/videoUrlReadder.util.js';

export const listLessons = async (filters, userId) => {
  const { tagId, cefrLevelId, mode, q, page, limit } = filters;

  // Lessons are public content — only published ones are listed.
  const query = { status: 'published' };
  if (tagId) query.tagIds = tagId;
  if (cefrLevelId) query.cefrLevelIds = cefrLevelId;
  if (mode) query.modes = mode;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const skip = (page - 1) * limit;
  const [lessons, totalItems] = await Promise.all([
    Lesson.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Lesson.countDocuments(query),
  ]);

  // Attach the current user's progress (one query, merged by lessonId).
  let progressMap = {};
  if (userId && lessons.length > 0) {
    const lessonIds = lessons.map((l) => l._id);
    const progresses = await UserLessonProgress.find({
      userId,
      lessonId: { $in: lessonIds },
    });
    progressMap = progresses.reduce((acc, p) => {
      acc[p.lessonId.toString()] = p;
      return acc;
    }, {});
  }

  const items = lessons.map((lesson) => ({
    lesson,
    userProgress: progressMap[lesson._id.toString()] || null,
  }));

  return {
    lessons: items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getLessonById = async (lessonId, userId) => {
  // Only published lessons are publicly visible.
  const lesson = await Lesson.findOne({ _id: lessonId, status: 'published' });
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);

  // Attach the current user's progress when authenticated.
  let userProgress = null;
  if (userId) {
    userProgress = await UserLessonProgress.findOne({ userId, lessonId });
  }

  return { lesson, userProgress };
};

export const getSegmentsByLessonId = async (lessonId, userId) => {
  // Segments belong to a lesson — reject if the lesson is missing/unpublished.
  const lesson = await Lesson.findOne({ _id: lessonId, status: 'published' });
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);

  const segments = await LessonSegment.find({ lessonId }).sort({ startMs: 1 });

  // Merge the current user's per-segment progress (one query, keyed by segmentId).
  let progressMap = {};
  if (userId && segments.length > 0) {
    const progresses = await UserSegmentProgress.find({
      userId,
      lessonId,
      segmentId: { $in: segments.map((s) => s._id) },
    });
    progressMap = progresses.reduce((acc, p) => {
      acc[p.segmentId.toString()] = p;
      return acc;
    }, {});
  }

  // Spec LessonSegmentListResponse.data is an array of { segment, userProgress }.
  return segments.map((segment) => ({
    segment,
    userProgress: progressMap[segment._id.toString()] || null,
  }));
};

export const getSegmentById = async (lessonId, segmentId, userId) => {
  // Don't serve segments of missing/unpublished lessons.
  const lesson = await Lesson.findOne({ _id: lessonId, status: 'published' });
  if (!lesson) throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);

  const segment = await LessonSegment.findOne({ _id: segmentId, lessonId });
  if (!segment) throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);

  let userProgress = null;
  if (userId) {
    userProgress = await UserSegmentProgress.findOne({
      userId,
      lessonId,
      segmentId,
    });
  }

  return { segment, userProgress };
};

export const listAdminLessons = async (filters) => {
  const { status, tagId, cefrLevelId, mode, q, page, limit } = filters;
  const query = {};
  if (status) query.status = status;
  if (tagId) query.tagIds = tagId;
  if (cefrLevelId) query.cefrLevelIds = cefrLevelId;
  if (mode) query.modes = mode;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const skip = (page - 1) * limit;
  const [lessons, totalItems] = await Promise.all([
    Lesson.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Lesson.countDocuments(query),
  ]);
  return {
    lessons,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

const validateData = (data) => {
  if (!data.title) {
    throw new AppError(ADMIN.LESSON_TITLE_REQUIRED, 400);
  }
  if (!data.sourceUrl) {
    throw new AppError(ADMIN.LESSON_SOURCE_URL_REQUIRED, 400);
  } else {
    const isYoutubeLink =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!isYoutubeLink.test(data.sourceUrl)) {
      throw new AppError(ADMIN.LESSON_SOURCE_URL_INVALID, 400);
    }
  }
  if (
    data.status &&
    !['draft', 'published', 'archived'].includes(data.status)
  ) {
    throw new AppError(ADMIN.LESSON_STATUS_INVALID, 400);
  }
};

export const createAdminLesson = async (data) => {
  validateData(data);
  let slug = data.slug;
  if (!data.slug) slug = generateSlug(data.title);
  const existing = await Lesson.findOne({ slug });
  if (existing) {
    throw new AppError(ADMIN.LESSON_TITLE_EXISTS, 400, {
      field: 'slug',
      message: MESSAGES[ADMIN.LESSON_TITLE_EXISTS],
    });
  }

  let durationMs;
  try {
    durationMs = await getDurationMsFromYoutube(data.sourceUrl);
  } catch (err) {
    if (err.message === ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK) {
      throw new AppError(ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK, 400);
    }
    throw err;
  }
  if(!durationMs)
    throw new AppError(ADMIN.LESSON_SOURCE_URL_INVALID, 400);

  const lesson = await Lesson.create({
    title: data.title,
    slug,
    description: data.description || '',
    tagIds: data.tagIds || [],
    cefrLevelIds: data.cefrLevelIds || [],
    modes: ['dictation', 'shadowing'],
    status: data.status || 'draft',
    sourceUrl: data.sourceUrl,
    thumbnailUrl: data.thumbnailUrl || '',
    ...(durationMs !== null && { durationMs }),
  });
  return lesson;
};

export const getAdminLessonById = async (lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  return lesson;
};

export const updateAdminLesson = async (lessonId, data) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  validateData(data);

  let slug = data.slug;
  if (!data.slug) slug = generateSlug(data.title);
  const existing = await Lesson.findOne({ slug, _id: { $ne: lessonId } });
  if (existing) {
    throw new AppError(ADMIN.LESSON_TITLE_EXISTS, 400, {
      field: 'slug',
      message: MESSAGES[ADMIN.LESSON_TITLE_EXISTS],
    });
  }
  lesson.slug = slug;
  lesson.title = data.title;

  if (data.description !== undefined) lesson.description = data.description;
  if (data.tagIds !== undefined) lesson.tagIds = data.tagIds;
  if (data.cefrLevelIds !== undefined) lesson.cefrLevelIds = data.cefrLevelIds;
  
  if (data.status !== undefined) {
    if (data.status === 'published' && lesson.status !== 'published') {
      const segmentCount = await LessonSegment.countDocuments({ lessonId });
      if (segmentCount === 0) {
        throw new AppError(ADMIN.LESSON_NO_SEGMENT, 400);
      }
      lesson.status = 'published';
      lesson.publishedAt = new Date();
    } else {
      lesson.status = data.status;
    }
  }

  if (data.sourceUrl !== undefined) {
    if (lesson.sourceUrl !== data.sourceUrl) {
      lesson.sourceUrl = data.sourceUrl;
      let durationMs;
      try {
        durationMs = await getDurationMsFromYoutube(data.sourceUrl);
      } catch (err) {
        if (err.message === ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK) {
          throw new AppError(ADMIN.LESSON_SOURCE_URL_DISABLED_PLAYBACK, 400);
        }
        throw err;
      }
      if (durationMs !== null) {
        lesson.durationMs = durationMs;
      } else {
        throw new AppError(ADMIN.LESSON_SOURCE_URL_INVALID, 400);
      }
    } else {
      lesson.sourceUrl = data.sourceUrl;
    }
  }

  if (data.thumbnailUrl !== undefined) lesson.thumbnailUrl = data.thumbnailUrl;
  await lesson.save();
  return lesson;
};

export const deleteAdminLesson = async (lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  lesson.status = 'archived';
  await lesson.save();
  return lesson;
};

export const listAdminLessonSegments = async (lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  const segments = await LessonSegment.find({ lessonId }).sort({ startMs: 1 });
  return segments;
};

const validateSegmentData = (data) => {
  if (
    data.startMs === undefined ||
    typeof data.startMs !== 'number' ||
    data.startMs < 0
  ) {
    throw new AppError(ADMIN.SEGMENT_START_MS_INVALID, 400);
  }
  if (
    data.endMs === undefined ||
    typeof data.endMs !== 'number' ||
    data.endMs < 1000
  ) {
    throw new AppError(ADMIN.SEGMENT_END_MS_INVALID, 400);
  } else {
    if (data.endMs <= data.startMs) {
      throw new AppError(ADMIN.SEGMENT_END_MS_LESS_THAN_START_MS, 400);
    }
  }
  if (!data.transcript?.original) {
    throw new AppError(ADMIN.SEGMENT_TRANSCRIPT_ORIGINAL_REQUIRED, 400);
  }
  if (!data.transcript?.normalized) {
    throw new AppError(ADMIN.SEGMENT_TRANSCRIPT_NORMALIZED_REQUIRED, 400);
  }
  if (!data.translation) {
    throw new AppError(ADMIN.SEGMENT_TRANSLATION_REQUIRED, 400);
  }
};

const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "") // Loại bỏ dấu câu
      .replace(/\s{2,}/g, " ") // Đưa nhiều dấu cách liên tiếp về 1 dấu cách
      .trim();
};

export const createAdminLessonSegment = async (lessonId, data) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  validateSegmentData(data);

  if (
    lesson.durationMs &&
    data.endMs > lesson.durationMs
  ) {
    throw new AppError(ADMIN.SEGMENT_END_MS_EXCEEDS_DURATION, 400);
  }

  const overlappingSegments = await LessonSegment.find({
    lessonId,
    startMs: { $lt: data.endMs },
    endMs: { $gt: data.startMs },
  });
  if (overlappingSegments.length > 0) {
    throw new AppError(ADMIN.SEGMENT_TIME_OVERLAPS, 400);
  }

  const segment = await LessonSegment.create({
    lessonId,
    startMs: data.startMs,
    endMs: data.endMs,
    transcript: {
      original: data.transcript.original,
      normalized: normalizeText(data.transcript.normalized),
    },
    translation: data.translation,
  });
  return segment;
};

export const getAdminLessonSegmentById = async (lessonId, segmentId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  const segment = await LessonSegment.findOne({ _id: segmentId, lessonId });
  if (!segment) throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);
  return segment;
};

export const updateAdminLessonSegment = async (lessonId, segmentId, data) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  const segment = await LessonSegment.findOne({ _id: segmentId, lessonId });
  if (!segment) throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);
  validateSegmentData(data);

  if (
    lesson.durationMs &&
    data.endMs > lesson.durationMs
  ) {
    throw new AppError(ADMIN.SEGMENT_END_MS_EXCEEDS_DURATION, 400);
  }

  const overlappingSegments = await LessonSegment.find({
    lessonId,
    _id: { $ne: segmentId },
    startMs: { $lt: data.endMs },
    endMs: { $gt: data.startMs },
  });
  if (overlappingSegments.length > 0) {
    throw new AppError(ADMIN.SEGMENT_TIME_OVERLAPS, 400);
  }

  segment.startMs = data.startMs;
  segment.endMs = data.endMs;
  segment.transcript = {
    original: data.transcript.original,
    normalized: normalizeText(data.transcript.normalized),
  };
  segment.translation = data.translation;
  await segment.save();
  return segment;
};

export const deleteAdminLessonSegment = async (lessonId, segmentId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);
  const segment = await LessonSegment.findOne({ _id: segmentId, lessonId });
  if (!segment) throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);
  await LessonSegment.deleteOne({ _id: segmentId });
};

export const deleteAdminMultipleLessonSegments = async (lessonId, segmentIds) => {
  if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, [{ field: 'segmentIds', message: 'Must be a non-empty array' }]);
  }
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(LESSON.LESSON_NOT_FOUND, 404);

  const segments = await LessonSegment.find({ _id: { $in: segmentIds }, lessonId });
  if (segments.length === 0) {
    throw new AppError(LESSON.SEGMENT_NOT_FOUND, 404);
  }

  const foundSegmentIds = segments.map((s) => s._id);
  await LessonSegment.deleteMany({ _id: { $in: foundSegmentIds } });
};
