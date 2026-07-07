import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId không hợp lệ');

export const getDeckSchema = z.object({
  deckId: objectIdSchema,
});

export const getTopicCardsSchema = z.object({
  deckId: objectIdSchema,
  topicId: objectIdSchema,
});

export const listDecksSchema = z.object({
  tagId: objectIdSchema.optional(),
  cefrLevelId: objectIdSchema.optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
