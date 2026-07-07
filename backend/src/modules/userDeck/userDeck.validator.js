import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId không hợp lệ');

export const deckIdParamSchema = z.object({
  deckId: objectIdSchema,
});

export const listMyDecksSchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createDeckSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tên bộ thẻ không được để trống')
    .max(100, 'Tên bộ thẻ tối đa 100 ký tự'),
  description: z.string().trim().max(500).optional(),
});

export const updateDeckSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Tên bộ thẻ không được để trống')
      .max(100, 'Tên bộ thẻ tối đa 100 ký tự')
      .optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.description !== undefined,
    {
      message:
        'Cần cung cấp ít nhất một trường để cập nhật (title hoặc description)',
    }
  );

// ---------- Topic ----------
export const topicIdParamSchema = z.object({
  deckId: objectIdSchema,
  topicId: objectIdSchema,
});

export const createTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên nhóm không được để trống')
    .max(100, 'Tên nhóm tối đa 100 ký tự'),
});

export const updateTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên nhóm không được để trống')
    .max(100, 'Tên nhóm tối đa 100 ký tự'),
});

// ---------- Card ----------
export const cardIdParamSchema = z.object({
  deckId: objectIdSchema,
  cardId: objectIdSchema,
});

export const listCardsSchema = z.object({
  topicId: objectIdSchema.optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createCardSchema = z.object({
  topicId: objectIdSchema,
  term: z
    .string()
    .trim()
    .min(1, 'Từ vựng không được để trống')
    .max(200, 'Từ vựng tối đa 200 ký tự'),
  translation: z
    .string()
    .trim()
    .min(1, 'Bản dịch không được để trống')
    .max(500, 'Bản dịch tối đa 500 ký tự'),
  definition: z.string().trim().max(1000).optional(),
  example: z.string().trim().max(1000).optional(),
  pos: z.string().trim().max(50).optional(),
});

export const updateCardSchema = z
  .object({
    term: z
      .string()
      .trim()
      .min(1, 'Từ vựng không được để trống')
      .max(200)
      .optional(),
    translation: z
      .string()
      .trim()
      .min(1, 'Bản dịch không được để trống')
      .max(500)
      .optional(),
    definition: z.string().trim().max(1000).optional(),
    example: z.string().trim().max(1000).optional(),
    pos: z.string().trim().max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  });
