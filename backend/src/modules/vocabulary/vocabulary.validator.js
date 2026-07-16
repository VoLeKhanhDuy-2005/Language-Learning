import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId không hợp lệ');

export const getCardsSchema = z
  .object({
    deckId: objectIdSchema.optional(),
    topicId: objectIdSchema.optional(),
  })
  .refine((data) => data.deckId || data.topicId, {
    message: 'Phải cung cấp ít nhất deckId hoặc topicId',
    path: ['deckId', 'topicId'],
  });

export const searchVocabularySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
