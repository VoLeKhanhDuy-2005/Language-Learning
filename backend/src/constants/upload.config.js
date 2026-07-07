export const UPLOAD_CONFIG = Object.freeze({
  'shadowing-audio': {
    prefix: 'shadowing',
    allowedTypes: [
      'audio/webm',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/ogg',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  'deck-import': {
    prefix: 'imports',
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  'card-image': {
    prefix: 'cards',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  avatar: {
    prefix: 'avatars',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
});

export const EXT_BY_TYPE = Object.freeze({
  'audio/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'text/csv': 'csv',
  'application/json': 'json',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
});
