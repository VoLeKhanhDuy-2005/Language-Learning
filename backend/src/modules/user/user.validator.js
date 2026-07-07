import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId is invalid');

export const getLessonSegmentsProgressSchema = z.object({
  lessonId: objectIdSchema,
});

export const getSegmentProgressSchema = z.object({
  lessonId: objectIdSchema,
  segmentId: objectIdSchema,
});

export const updateSegmentProgressSchema = z.object({
  params: z.object({
    lessonId: objectIdSchema,
    segmentId: objectIdSchema,
  }),
  body: z
    .object({
      dictation: z
        .object({
          attemptCount: z.coerce.number().int().min(1),
          hintUsedCount: z.coerce.number().int().min(0),
        })
        .optional(),
      shadowing: z
        .object({
          attemptCount: z.coerce.number().int().min(1),
          latestAudioUrl: z.string().min(1),
        })
        .optional(),
    })
    .refine(
      (data) => data.dictation !== undefined || data.shadowing !== undefined,
      {
        message: 'There should be at least dictation or shadowing.',
      }
    ),
});

export const getCardStatesSchema = z.object({
  deckId: objectIdSchema.optional(),
  topicId: objectIdSchema.optional(),
  due: z
    .string()
    .transform((value) => value === 'true')
    .optional(), //nhận due, starred, hidden là string trả về true/false
  starred: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  hidden: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const getCardStateSchema = z.object({
  cardId: objectIdSchema,
});

const srsSchema = z.object({
  lastGrade: z.number().int().min(0).max(3),
});

const flagsSchema = z.object({
  starred: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const patchCardStateSchema = z.object({
  params: z.object({
    cardId: objectIdSchema,
  }),
  body: z.object({
    deckId: objectIdSchema.optional(),
    topicId: objectIdSchema.optional(),
    srs: srsSchema.optional(),
    flags: flagsSchema.optional(),
  }),
});

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(50, 'Display name must be at most 50 characters')
      .regex(
        /^[a-zA-Z0-9\sÀ-ỹ]*$/,
        'Display name must not contain special characters'
      )
      .optional(),
    oldPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
    confirmPassword: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword || data.oldPassword || data.confirmPassword) {
      if (!data.oldPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter current password',
          path: ['oldPassword'],
        });
      }
      if (!data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter new password',
          path: ['newPassword'],
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password confirmation does not match.',
          path: ['confirmPassword'],
        });
      }
    }
  });

export const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter new password',
        path: ['newPassword'],
      });
    }
  });
