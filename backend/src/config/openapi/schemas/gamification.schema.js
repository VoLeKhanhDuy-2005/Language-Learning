export default {
  GamificationStreakData: {
    type: 'object',
    properties: {
      currentStreak: {
        type: 'integer',
        description: 'Số ngày học liên tiếp hiện tại.',
        example: 5,
      },
      longestStreak: {
        type: 'integer',
        description: 'Kỷ lục streak cao nhất từ trước đến nay.',
        example: 12,
      },
      lastActiveDayKey: {
        type: 'string',
        nullable: true,
        description:
          'Ngày cuối cùng có hành động học (YYYY-MM-DD, UTC+7). null nếu chưa học.',
        example: '2026-06-20',
      },
      activeToday: {
        type: 'boolean',
        description: 'User đã có hành động học hôm nay hay chưa.',
        example: true,
      },
    },
  },
  GamificationStreakResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'STREAK_FETCHED' },
      message: { type: 'string', example: 'Streak fetched' },
      data: { $ref: '#/components/schemas/GamificationStreakData' },
    },
  },

  GamificationProfileData: {
    type: 'object',
    properties: {
      totalXp: {
        type: 'integer',
        description: 'Tổng XP tích lũy all-time.',
        example: 340,
      },
      level: {
        type: 'integer',
        description: 'Cấp độ hiện tại, tính từ totalXp.',
        example: 2,
      },
      currentStreak: {
        type: 'integer',
        description: 'Số ngày học liên tiếp hiện tại.',
        example: 5,
      },
      longestStreak: {
        type: 'integer',
        description: 'Kỷ lục streak cao nhất từ trước đến nay.',
        example: 12,
      },
      xpIntoLevel: {
        type: 'integer',
        description:
          'XP đã tích lũy bên trong level hiện tại (tính từ sàn của level).',
        example: 40,
      },
      xpForNextLevel: {
        type: 'integer',
        description:
          'Tổng XP cần thiết để hoàn thành level hiện tại và lên cấp.',
        example: 200,
      },
      progressPct: {
        type: 'integer',
        description: 'Phần trăm tiến độ tới level kế (0–100).',
        example: 20,
      },
    },
  },
  GamificationProfileResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'PROFILE_FETCHED' },
      message: { type: 'string', example: 'Profile fetched' },
      data: { $ref: '#/components/schemas/GamificationProfileData' },
    },
  },

  GamificationRankData: {
    type: 'object',
    properties: {
      rank: {
        type: 'integer',
        description: 'Thứ hạng của user hiện tại (1 = cao nhất).',
        example: 5,
      },
      totalXp: {
        type: 'integer',
        description: 'Tổng XP của user.',
        example: 340,
      },
      totalPlayers: {
        type: 'integer',
        description: 'Tổng số người chơi có trong bảng xếp hạng.',
        example: 120,
      },
    },
  },
  GamificationRankResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'RANK_FETCHED' },
      message: { type: 'string', example: 'Rank fetched' },
      data: { $ref: '#/components/schemas/GamificationRankData' },
    },
  },

  GamificationLeaderboardItem: {
    type: 'object',
    properties: {
      rank: {
        type: 'integer',
        description: 'Thứ hạng (1 = cao nhất).',
        example: 1,
      },
      userId: {
        type: 'string',
        description: 'ID của user.',
        example: '664f1a2b3c4d5e6f7a8b9c0d',
      },
      name: {
        type: 'string',
        nullable: true,
        description: 'Tên hiển thị.',
        example: 'Nguyen Van A',
      },
      avatarUrl: {
        type: 'string',
        nullable: true,
        description: 'Ảnh đại diện.',
        example: null,
      },
      totalXp: { type: 'integer', description: 'Tổng XP.', example: 520 },
      level: { type: 'integer', description: 'Cấp độ hiện tại.', example: 3 },
    },
  },
  GamificationLeaderboardData: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/GamificationLeaderboardItem' },
      },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: {
        type: 'integer',
        description: 'Tổng số users có trong bảng xếp hạng.',
        example: 42,
      },
    },
  },
  GamificationLeaderboardResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'LEADERBOARD_FETCHED' },
      message: { type: 'string', example: 'Leaderboard fetched' },
      data: { $ref: '#/components/schemas/GamificationLeaderboardData' },
    },
  },
};
