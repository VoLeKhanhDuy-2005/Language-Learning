export const COMMON = Object.freeze({
  INVALID_DATA: 'INVALID_DATA',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
});

export const COMMON_MESSAGES = {
  INVALID_DATA: 'Invalid request data',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  UNAUTHORIZED: 'Not authenticated or token is invalid',
  FORBIDDEN: 'You do not have permission to access this resource',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE:
    'Service temporarily unavailable, please try again later',
  RATE_LIMITED: 'Too many requests, please try again later',
};
