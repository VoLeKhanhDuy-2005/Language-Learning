const AiBadRequest = {
  description: 'Dữ liệu đầu vào không hợp lệ',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingQuestion: {
          summary: 'Thiếu câu hỏi',
          value: {
            success: false,
            message: 'Bắt buộc nhập câu hỏi',
          },
        },
      },
    },
  },
};

export default {
  '/ai/cards/auto-fill': {
    post: {
      tags: ['AI Assistant'],
      summary: 'Tự động điền thẻ từ vựng bằng AI',
      description:
        'Dựa vào từ vựng hoặc nghĩa tiếng Việt để tự động sinh ra các trường dữ liệu còn thiếu cho thẻ từ vựng (phát âm, từ loại, giải thích, ví dụ...).',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['word'],
              properties: {
                word: {
                  type: 'string',
                  example: 'apple',
                  description: 'Từ vựng tiếng Anh hoặc nghĩa tiếng Việt',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Auto fill thành công',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CardAutoFillResponse',
              },
            },
          },
        },
        400: {
          description: 'Dữ liệu không hợp lệ',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'INVALID_DATA',
                message: 'Invalid request data',
                errors: [
                  { field: 'word', message: 'The word field is required' },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
