import { MESSAGES } from '../constants/codes/index.js';

// Operational error carrying an i18n `code`. Message resolves from the central
// catalog by code; pass `message` to override for interpolated/dynamic text.
class AppError extends Error {
  constructor(code, statusCode, errors = [], message) {
    super(message ?? MESSAGES[code] ?? code);
    this.code = code;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

export default AppError;
