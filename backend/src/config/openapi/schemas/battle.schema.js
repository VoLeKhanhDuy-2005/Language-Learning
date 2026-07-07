export default {
  BattlePlayer: {
    type: 'object',
    properties: {
      userId: {
        oneOf: [
          { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
          {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
              name: { type: 'string', nullable: true, example: 'Nguyen Van A' },
              avatarUrl: { type: 'string', nullable: true, example: null },
            },
          },
        ],
        description: 'ID người chơi (populated thành object name/avatarUrl).',
      },
      score: {
        type: 'integer',
        description: 'Tổng điểm trong trận.',
        example: 420,
      },
      correctCount: {
        type: 'integer',
        description: 'Số câu trả lời đúng.',
        example: 4,
      },
      connected: {
        type: 'boolean',
        description: 'Còn kết nối lúc kết thúc trận.',
        example: true,
      },
    },
  },

  BattleQuestion: {
    type: 'object',
    description:
      'Câu hỏi. Prompt hiển thị nằm ở field `term`, ý nghĩa thay đổi theo mode: ' +
      'mcq → term là từ tiếng Anh, options là các nghĩa tiếng Việt; ' +
      'typing → term là nghĩa tiếng Việt, correctAnswer là từ tiếng Anh (user gõ).',
    properties: {
      cardId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
      term: {
        type: 'string',
        description:
          'Prompt hiển thị. mcq: từ tiếng Anh. typing: nghĩa tiếng Việt.',
        example: 'ephemeral',
      },
      correctAnswer: {
        type: 'string',
        description:
          'Đáp án đúng (đã normalize). mcq: nghĩa tiếng Việt. typing: từ tiếng Anh.',
        example: 'phù du',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description:
          'mcq: 4 nghĩa tiếng Việt (1 đúng + 3 distractor). typing: rỗng [].',
        example: ['phù du', 'vĩnh cửu', 'mạnh mẽ', 'yên tĩnh'],
      },
    },
  },

  BattleMatchSummary: {
    type: 'object',
    description: 'Thông tin trận rút gọn (không kèm questions).',
    properties: {
      _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
      mode: { type: 'string', enum: ['mcq', 'typing'], example: 'mcq' },
      matchType: {
        type: 'string',
        enum: ['queue', 'invite'],
        description:
          'queue = ghép random (được trao XP). invite = phòng riêng (friendly-only, KHÔNG trao XP).',
        example: 'queue',
      },
      status: {
        type: 'string',
        enum: ['waiting', 'in_progress', 'finished', 'abandoned'],
        example: 'finished',
      },
      players: {
        type: 'array',
        items: { $ref: '#/components/schemas/BattlePlayer' },
      },
      winnerId: {
        nullable: true,
        description:
          'Người thắng (null nếu hòa). Populated thành object name/avatarUrl.',
        oneOf: [
          { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
          {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
              name: { type: 'string', nullable: true, example: 'Nguyen Van A' },
              avatarUrl: { type: 'string', nullable: true, example: null },
            },
          },
        ],
      },
      startedAt: { type: 'string', format: 'date-time' },
      finishedAt: { type: 'string', format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  BattleMatchDetail: {
    allOf: [
      { $ref: '#/components/schemas/BattleMatchSummary' },
      {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: { $ref: '#/components/schemas/BattleQuestion' },
          },
        },
      },
    ],
  },

  BattleHistoryData: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/BattleMatchSummary' },
      },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: {
        type: 'integer',
        description: 'Tổng số trận finished của user.',
        example: 17,
      },
    },
  },
  BattleHistoryResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'HISTORY_FETCHED' },
      message: { type: 'string', example: 'Battle history fetched' },
      data: { $ref: '#/components/schemas/BattleHistoryData' },
    },
  },

  BattleMatchResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'MATCH_FETCHED' },
      message: { type: 'string', example: 'Battle match fetched' },
      data: { $ref: '#/components/schemas/BattleMatchDetail' },
    },
  },
};
