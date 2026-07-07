import { bearerAuth } from '../helpers/security.js';

const TAG = 'Vocabulary';

export default {
  '/vocabulary/search': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Tìm từ vựng trong kho hệ thống',
      description:
        'Tìm card thuộc các deck hệ thống (ownerType = system, đã publish) theo từ khóa khớp với term. Dùng để gợi ý / điền sẵn khi tạo thẻ trong deck cá nhân.',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          description: 'Từ khóa tìm kiếm (khớp với term).',
          schema: { type: 'string', maxLength: 100, example: 'family' },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Số kết quả tối đa.',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      ],
      responses: {
        200: {
          description: 'Tìm kiếm từ vựng thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VocabularySearchResponse',
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
