export const FILE = Object.freeze({
  PRESIGNED_URL_SUCCESS: 'PRESIGNED_URL_SUCCESS',
  INVALID_PURPOSE: 'INVALID_PURPOSE',
  CONTENT_TYPE_NOT_ALLOWED: 'CONTENT_TYPE_NOT_ALLOWED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_IMAGE_FORMAT: 'INVALID_IMAGE_FORMAT',
  KEY_OWNERSHIP_MISMATCH: 'KEY_OWNERSHIP_MISMATCH',
  UPLOAD_NOT_FOUND: 'UPLOAD_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
});

export const FILE_MESSAGES = {
  PRESIGNED_URL_SUCCESS: 'Presigned URL created successfully',
  INVALID_PURPOSE: 'Invalid purpose',
  CONTENT_TYPE_NOT_ALLOWED: 'Content type is not allowed for this purpose',
  FILE_TOO_LARGE: 'File exceeds the allowed size limit',
  INVALID_IMAGE_FORMAT:
    'Invalid file format! Only JPG/PNG images are accepted.',
  KEY_OWNERSHIP_MISMATCH: 'You do not own this upload',
  UPLOAD_NOT_FOUND: 'Uploaded object not found',
  RESOURCE_NOT_FOUND: 'Target resource not found',
};
