import { z } from 'zod';

export const presignedUrlSchema = z.object({
  contentType: z.string().trim().min(1, 'contentType is required'),
  purpose: z.enum(['shadowing-audio', 'deck-import', 'card-image', 'avatar'], {
    errorMap: () => ({ message: 'Invalid purpose' }),
  }),
  fileSize: z.coerce
    .number()
    .int()
    .positive({ message: 'fileSize must be a positive integer' }),
});
