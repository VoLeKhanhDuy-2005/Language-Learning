import { MESSAGES } from '../constants/codes/index.js';

export const successResponse = (code, data = null, message) => ({
  success: true,
  code,
  message: message ?? MESSAGES[code] ?? code,
  ...(data !== null && { data }),
});
