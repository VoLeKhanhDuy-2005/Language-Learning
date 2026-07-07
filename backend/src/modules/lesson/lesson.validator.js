import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId không hợp lệ');

export const getLessonSchema = z.object({
  lessonId: objectIdSchema,
});

export const getSegmentsSchema = z.object({
  lessonId: objectIdSchema,
});

export const getSegmentSchema = z.object({
  lessonId: objectIdSchema,
  segmentId: objectIdSchema,
});

export const listLessonsSchema = z.object({
  tagId: objectIdSchema.optional(),
  cefrLevelId: objectIdSchema.optional(),
  mode: z.enum(['dictation', 'shadowing']).optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
