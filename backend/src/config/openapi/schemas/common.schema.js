export default {
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      // Stable i18n key; the frontend maps it to a localized string.
      code: { type: 'string', example: 'OPERATION_SUCCESS' },
      // English default message (fallback when no translation exists).
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { type: 'object', nullable: true },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      // Stable i18n key; the frontend maps it to a localized string.
      code: { type: 'string', example: 'INVALID_DATA' },
      // English default message (fallback when no translation exists).
      message: { type: 'string', example: 'Invalid request data' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
};
