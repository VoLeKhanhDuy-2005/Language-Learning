import { z } from 'zod';

export const listTagsSchema = z.object({
  usedBy: z.enum(['lesson', 'deck']).optional(),
});
