const TAG = 'Metadata';

export default {
  '/cefr-levels': {
    get: {
      tags: [TAG],
      summary: 'Lấy danh sách CEFR level',
      description:
        'Danh sách level CEFR (A1, A2, ...) dùng để filter lesson/deck. Công khai, không cần đăng nhập.',
      responses: {
        200: {
          description: 'Lấy danh sách CEFR level thành công.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CefrLevelsResponse' },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/tags': {
    get: {
      tags: [TAG],
      summary: 'Lấy danh sách tag',
      description:
        'Danh sách tag dùng để filter lesson/deck. Công khai. Không truyền usedBy = tất cả tag; usedBy=lesson|deck = chỉ tag đang được lesson/deck (đã publish) sử dụng.',
      parameters: [
        {
          name: 'usedBy',
          in: 'query',
          required: false,
          description:
            'Giới hạn tag theo loại nội dung đang dùng: lesson hoặc deck.',
          schema: { type: 'string', enum: ['lesson', 'deck'], example: 'deck' },
        },
      ],
      responses: {
        200: {
          description: 'Tags retrieved successfully.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TagsResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
