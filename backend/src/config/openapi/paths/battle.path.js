import { bearerAuth } from '../helpers/security.js';

const TAG = 'Battle';

export default {
  '/battle/history': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lịch sử battle của user hiện tại',
      description:
        'Danh sách các trận đã kết thúc (status=finished) mà user là người tham gia, sắp xếp finishedAt giảm dần. Không trả về questions (cho nhẹ). limit tối đa 100.',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Trang hiện tại.',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Số trận mỗi trang (tối đa 100).',
        },
      ],
      responses: {
        200: {
          description: 'Lấy lịch sử thành công.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BattleHistoryResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  '/battle/{id}': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Chi tiết một trận battle',
      description:
        'Trả về đầy đủ thông tin trận đấu (bao gồm questions). Chỉ người tham gia trận mới xem được — không phải participant trả về 403.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId của trận đấu.',
          example: '664f1a2b3c4d5e6f7a8b9c0d',
        },
      ],
      responses: {
        200: {
          description: 'Lấy chi tiết trận thành công.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BattleMatchResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
