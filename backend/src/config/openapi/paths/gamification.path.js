import { bearerAuth } from '../helpers/security.js';

const TAG = 'Gamification';

export default {
  '/gamification/streak': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy trạng thái streak của user',
      description:
        'Trả về chuỗi ngày học liên tiếp hiện tại, kỷ lục, và trạng thái hôm nay. Streak chỉ tăng khi có hành động học thật (hoàn thành segment, review card qua SRS grade, chơi battle) — không có write endpoint, không có heartbeat.',
      responses: {
        200: {
          description: 'Lấy streak thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GamificationStreakResponse',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  '/gamification/leaderboard': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Bảng xếp hạng toàn hệ thống theo XP',
      description:
        'Danh sách user xếp hạng giảm dần theo totalXp all-time. Hòa điểm tiebreak bằng _id tăng dần (ổn định khi phân trang). limit tối đa 100.',
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
          description: 'Số user mỗi trang (tối đa 100).',
        },
      ],
      responses: {
        200: {
          description: 'Lấy leaderboard thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GamificationLeaderboardResponse',
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

  '/gamification/me/rank': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy thứ hạng của user hiện tại',
      description:
        'Trả về thứ hạng của user trong bảng xếp hạng toàn cầu. rank = (số người có totalXp lớn hơn) + 1. Nếu chưa có hoạt động, rank = tổng số người chơi (xp=0).',
      responses: {
        200: {
          description: 'Lấy rank thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GamificationRankResponse',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  '/gamification/me': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy hồ sơ gamification của user',
      description:
        'Trả về tổng XP, cấp độ hiện tại, streak, và tiến độ đến level kế tiếp. Nếu user chưa có hoạt động, trả về defaults (xp=0, level=1). Level tính theo công thức lũy tiến: requiredXpForLevel(L) = 50 * L * (L+1).',
      responses: {
        200: {
          description: 'Lấy hồ sơ thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GamificationProfileResponse',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
