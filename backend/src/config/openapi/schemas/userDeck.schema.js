export default {
  UserOwnedDeck: {
    allOf: [
      { $ref: '#/components/schemas/Deck' },
      {
        type: 'object',
        properties: {
          ownerType: {
            type: 'string',
            enum: ['user'],
            example: 'user',
          },
          ownerId: {
            type: 'string',
            example: '665f1f77bcf86cd799439020',
          },
          status: {
            type: 'string',
            enum: ['published'],
            example: 'published',
          },
        },
      },
    ],
  },

  // ---------- Deck ----------
  UserDeckCreateRequest: {
    type: 'object',
    required: ['title'],
    description:
      'Tạo bộ thẻ cá nhân. Chỉ cần tên; deck luôn ở trạng thái published và thuộc sở hữu người dùng hiện tại.',
    properties: {
      title: {
        type: 'string',
        maxLength: 100,
        example: 'Bộ thẻ của tôi',
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: 'Từ vựng cá nhân cần ôn.',
      },
    },
  },
  UserDeckUpdateRequest: {
    type: 'object',
    description:
      'Các trường đều tùy chọn nhưng phải gửi ít nhất một (title hoặc description).',
    properties: {
      title: {
        type: 'string',
        maxLength: 100,
        example: 'Bộ thẻ của tôi (đã sửa)',
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: 'Mô tả mới.',
      },
    },
  },
  UserDeckListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'MY_DECK_LIST_SUCCESS' },
      message: {
        type: 'string',
        example: 'Your decks retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          decks: {
            type: 'array',
            description:
              'Chỉ gồm các deck có ownerType = user và ownerId là người dùng hiện tại.',
            items: { $ref: '#/components/schemas/UserOwnedDeck' },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              totalItems: { type: 'integer', example: 3 },
              totalPages: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  },
  UserDeckDetailResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'DECK_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Deck detail retrieved successfully',
      },
      data: { $ref: '#/components/schemas/UserOwnedDeck' },
    },
  },
  UserDeckCreateResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'DECK_CREATE_SUCCESS' },
      message: { type: 'string', example: 'Deck created successfully' },
      data: { $ref: '#/components/schemas/UserOwnedDeck' },
    },
  },
  UserDeckUpdateResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'DECK_UPDATE_SUCCESS' },
      message: { type: 'string', example: 'Deck updated successfully' },
      data: { $ref: '#/components/schemas/UserOwnedDeck' },
    },
  },

  // ---------- Topic ----------
  UserTopicCreateRequest: {
    type: 'object',
    required: ['name'],
    description:
      'Tạo nhóm (topic) mới. Chỉ cần tên; thứ tự (order) được gán tự động ở cuối danh sách.',
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Family' },
    },
  },
  UserTopicUpdateRequest: {
    type: 'object',
    required: ['name'],
    description: 'Đổi tên nhóm (topic).',
    properties: {
      name: { type: 'string', maxLength: 100, example: 'Family (updated)' },
    },
  },
  UserTopicListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TOPIC_LIST_SUCCESS' },
      message: { type: 'string', example: 'Topics retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          deck: { $ref: '#/components/schemas/UserOwnedDeck' },
          topics: {
            type: 'array',
            items: { $ref: '#/components/schemas/Topic' },
          },
        },
      },
    },
  },
  UserTopicMutationResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TOPIC_CREATE_SUCCESS' },
      message: { type: 'string', example: 'Topic created successfully' },
      data: { $ref: '#/components/schemas/Topic' },
    },
  },

  // ---------- Card ----------
  UserCardCreateRequest: {
    type: 'object',
    required: ['topicId', 'term', 'translation'],
    description:
      'Tạo thẻ từ vựng trong deck cá nhân. definition lưu vào explanation.vi, example lưu vào examples.en. order tự gán ở cuối nhóm.',
    properties: {
      topicId: {
        type: 'string',
        pattern: '^[a-fA-F0-9]{24}$',
        description: 'Nhóm (topic) chứa thẻ; phải thuộc deck này.',
        example: '665f1f77bcf86cd799439041',
      },
      term: { type: 'string', maxLength: 200, example: 'family' },
      translation: { type: 'string', maxLength: 500, example: 'gia đình' },
      definition: {
        type: 'string',
        maxLength: 1000,
        description: 'Định nghĩa (tùy chọn) → explanation.vi.',
        example: 'Những người có quan hệ huyết thống.',
      },
      example: {
        type: 'string',
        maxLength: 1000,
        description: 'Câu ví dụ (tùy chọn) → examples.en.',
        example: 'My family has four people.',
      },
      pos: {
        type: 'string',
        maxLength: 50,
        description: 'Loại từ (tùy chọn).',
        example: 'noun',
      },
    },
  },
  UserCardUpdateRequest: {
    type: 'object',
    description:
      'Tất cả các trường đều tùy chọn; gửi ít nhất một. definition → explanation.vi, example → examples.en. Thẻ giữ nguyên topic (không hỗ trợ chuyển nhóm).',
    properties: {
      term: { type: 'string', maxLength: 200, example: 'family' },
      translation: { type: 'string', maxLength: 500, example: 'gia đình' },
      definition: { type: 'string', maxLength: 1000 },
      example: { type: 'string', maxLength: 1000 },
      pos: { type: 'string', maxLength: 50, example: 'noun' },
    },
  },
  UserCardListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'CARD_LIST_SUCCESS' },
      message: { type: 'string', example: 'Cards retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: { $ref: '#/components/schemas/Card' },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              totalItems: { type: 'integer', example: 49 },
              totalPages: { type: 'integer', example: 3 },
            },
          },
        },
      },
    },
  },
  UserCardMutationResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'CARD_CREATE_SUCCESS' },
      message: { type: 'string', example: 'Card created successfully' },
      data: { $ref: '#/components/schemas/Card' },
    },
  },
};
