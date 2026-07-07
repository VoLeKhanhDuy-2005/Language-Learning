export default {
  CefrLevel: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '64a1234567890abcdef12345',
        description: 'ID tag.',
      },
      code: {
        type: 'string',
        example: 'a1',
        description: 'Mã ngắn (ví dụ: a1, a2).',
      },
      label: {
        type: 'string',
        example: 'A1',
        description: 'Tên hiển thị (ví dụ: A1, A2).',
      },
      createdAt: {
        type: 'string',
        description: 'Thời gian tạo.',
        example: '2026-06-15T10:02:04.740Z',
      },
      updatedAt: {
        type: 'string',
        description: 'Thời gian cập nhật.',
        example: '2026-06-15T10:02:04.740Z',
      },
    },
  },
  CefrLevelsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'CEFR_LIST_SUCCESS' },
      message: {
        type: 'string',
        example: 'CEFR levels retrieved successfully',
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CefrLevel',
        },
      },
    },
  },
  CefrLevelPayload: {
    type: 'object',
    required: ['label'],
    properties: {
      label: {
        type: 'string',
        example: 'A1',
        description: 'Tên hiển thị (ví dụ: A1, A2).',
      },
    },
  },
  CefrLevelResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'CEFR_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'CEFR level detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/CefrLevel',
      },
    },
  },
  Tag: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '64a1234567890abcdef12345',
        description: 'ID tag.',
      },
      code: {
        type: 'string',
        example: 'movie',
        description: 'Mã ngắn (ví dụ: movie, daily).',
      },
      label: {
        type: 'string',
        example: 'Movie',
        description: 'Tên hiển thị (ví dụ: Movie, Daily).',
      },
      createdAt: {
        type: 'string',
        description: 'Thời gian tạo.',
        example: '2026-06-15T10:02:04.740Z',
      },
      updatedAt: {
        type: 'string',
        description: 'Thời gian cập nhật.',
        example: '2026-06-15T10:02:04.740Z',
      },
    },
  },
  TagsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TAG_LIST_SUCCESS' },
      message: { type: 'string', example: 'Tags retrieved successfully' },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Tag',
        },
      },
    },
  },
  TagPayload: {
    type: 'object',
    required: ['label'],
    properties: {
      label: {
        type: 'string',
        example: 'Movie',
        description: 'Tên hiển thị (ví dụ: Movie, Daily).',
      },
    },
  },
  TagResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TAG_DETAIL_SUCCESS' },
      message: { type: 'string', example: 'Tag detail retrieved successfully' },
      data: {
        $ref: '#/components/schemas/Tag',
      },
    },
  },
  Lesson: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '64a1234567890abcdef12345',
        description: 'ID lesson.',
      },
      title: {
        type: 'string',
        example: 'Ted Talk: How to speak',
        description: 'Tên bài học.',
      },
      slug: {
        type: 'string',
        example: 'ted-talk-how-to-speak',
        description: 'Chuỗi URL thân thiện.',
      },
      description: {
        type: 'string',
        example: 'Bài học luyện nghe qua video TED Talk.',
        description: 'Mô tả ngắn.',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['64a1234567890abcdef12345'],
        description: 'Danh sách ID tag.',
      },
      cefrLevelIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['64a1234567890abcdef12345'],
        description: 'Danh sách ID CEFR level.',
      },
      modes: {
        type: 'array',
        items: { type: 'string' },
        example: ['dictation', 'shadowing'],
        description: 'Chế độ hỗ trợ.',
      },
      status: {
        type: 'string',
        enum: ['draft', 'published', 'archived'],
        example: 'published',
        description: 'Trạng thái bài học.',
      },
      publishedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Ngày công khai bài học.',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      sourceUrl: {
        type: 'string',
        example: 'https://youtube.com/watch?v=123',
        description: 'URL gốc để phát media.',
      },
      thumbnailUrl: {
        type: 'string',
        example: 'https://img.youtube.com/vi/123/hqdefault.jpg',
        description: 'Ảnh thumbnail.',
      },
    },
  },
  LessonsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'LESSON_LIST_SUCCESS' },
      message: { type: 'string', example: 'Lessons retrieved successfully' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Lesson' },
      },
      pagination: {
        type: 'object',
        properties: {
          totalItems: { type: 'integer', example: 100 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 10 },
        },
      },
    },
  },
  LessonPayload: {
    type: 'object',
    required: ['title', 'sourceUrl'],
    properties: {
      title: {
        type: 'string',
        example: 'Ted Talk: How to speak',
        description: 'Tên bài học.',
      },
      slug: {
        type: 'string',
        example: 'ted-talk-how-to-speak',
        description: 'Chuỗi URL thân thiện. Nếu bỏ trống sẽ tự sinh từ title.',
      },
      description: {
        type: 'string',
        example: 'Bài học luyện nghe qua video TED Talk.',
        description: 'Mô tả ngắn.',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['64a1234567890abcdef12345'],
        description: 'Danh sách ID tag.',
      },
      cefrLevelIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['64a1234567890abcdef12345'],
        description: 'Danh sách ID CEFR level.',
      },
      sourceUrl: {
        type: 'string',
        example: 'https://youtube.com/watch?v=123',
        description: 'URL gốc để phát media.',
      },
      thumbnailUrl: {
        type: 'string',
        example: 'https://img.youtube.com/vi/123/hqdefault.jpg',
        description: 'Ảnh thumbnail.',
      },
    },
  },
  LessonResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'LESSON_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Lesson detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/Lesson',
      },
    },
  },
  Segment: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '64b1234567890abcdef12345',
        description: 'ID segment.',
      },
      lessonId: {
        type: 'string',
        example: '64a1234567890abcdef12345',
        description: 'Segment thuộc lesson nào.',
      },
      startMs: {
        type: 'integer',
        minimum: 0,
        example: 1000,
        description: 'Thời điểm bắt đầu bằng mili giây (phải >= 0).',
      },
      endMs: {
        type: 'integer',
        minimum: 0,
        example: 5000,
        description: 'Thời điểm kết thúc bằng mili giây (phải > startMs).',
      },
      transcript: {
        type: 'object',
        properties: {
          original: {
            type: 'string',
            example: 'Hello world!',
            description: 'Câu gốc đầy đủ.',
          },
          normalized: {
            type: 'string',
            example: 'hello world',
            description: 'Chuẩn hóa để so sánh.',
          },
        },
      },
      translation: {
        type: 'string',
        example: 'Chào thế giới!',
        description: 'Bản dịch.',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  SegmentsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'SEGMENT_LIST_SUCCESS' },
      message: { type: 'string', example: 'Segments retrieved successfully' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Segment' },
      },
    },
  },
  SegmentPayload: {
    type: 'object',
    required: ['startMs', 'endMs', 'transcript', 'translation'],
    properties: {
      startMs: {
        type: 'integer',
        minimum: 0,
        example: 1000,
        description: 'Thời điểm bắt đầu bằng mili giây (phải >= 0).',
      },
      endMs: {
        type: 'integer',
        minimum: 0,
        example: 5000,
        description: 'Thời điểm kết thúc bằng mili giây (phải > startMs).',
      },
      transcript: {
        type: 'object',
        required: ['original', 'normalized'],
        properties: {
          original: {
            type: 'string',
            example: 'Hello world!',
            description: 'Câu gốc đầy đủ.',
          },
          normalized: {
            type: 'string',
            example: 'hello world',
            description: 'Chuẩn hóa để so sánh.',
          },
        },
      },
      translation: {
        type: 'string',
        example: 'Chào thế giới!',
        description: 'Bản dịch.',
      },
    },
  },
  SegmentResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'SEGMENT_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Segment detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/Segment',
      },
    },
  },
  DeckPayload: {
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        example: 'Travel Vocabulary',
        description: 'Tên bộ thẻ.',
      },
      slug: {
        type: 'string',
        example: 'travel-vocabulary',
        description: 'URL thân thiện. Nếu bỏ trống tự sinh từ title.',
      },
      description: {
        type: 'string',
        example: 'Common English words and phrases for travel.',
        description: 'Mô tả ngắn về deck.',
      },
      coverImage: {
        type: 'string',
        example: 'https://example.com/images/travel.jpg',
        description: 'Ảnh bìa.',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['665f1f77bcf86cd799439011'],
        description: 'Danh sách ID tag.',
      },
      cefrLevelIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['665f1f77bcf86cd799439012'],
        description: 'Danh sách ID CEFR level.',
      },
      status: {
        type: 'string',
        enum: ['draft', 'published', 'archived'],
        example: 'draft',
        description: 'Trạng thái bộ thẻ.',
      },
    },
  },
  TopicsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TOPIC_LIST_SUCCESS' },
      message: { type: 'string', example: 'Topics retrieved successfully' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Topic' },
      },
    },
  },
  TopicResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'TOPIC_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Topic detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/Topic',
      },
    },
  },
  TopicPayload: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Family', description: 'Tên topic.' },
      slug: {
        type: 'string',
        example: 'family',
        description: 'URL thân thiện. Nếu bỏ trống tự sinh từ name.',
      },
    },
  },
  TopicReorderPayload: {
    type: 'object',
    required: ['topics'],
    properties: {
      topics: {
        type: 'array',
        description: 'Mảng các topic kèm thứ tự mới',
        items: {
          type: 'object',
          required: ['topicId', 'order'],
          properties: {
            topicId: { type: 'string', example: '665f1f77bcf86cd799439041' },
            order: { type: 'integer', example: 1 },
          },
        },
      },
    },
  },
  CardsResponse: {
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
            items: {
              $ref: '#/components/schemas/Card',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              totalItems: {
                type: 'integer',
                example: 100,
              },
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              totalPages: {
                type: 'integer',
                example: 10,
              },
              pos: {
                type: 'string',
                example: 'verb',
                description: 'Part of speech filter',
              },
            },
          },
        },
      },
    },
  },
  CardResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'CARD_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Card detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/Card',
      },
    },
  },
  CardPayload: {
    type: 'object',
    required: ['topicId', 'term', 'pos', 'translation'],
    properties: {
      topicId: {
        type: 'string',
        example: '665f1f77bcf86cd799439041',
        description: 'ID của topic chứa card.',
      },
      term: { type: 'string', example: 'family', description: 'Từ vựng.' },
      pos: { type: 'string', example: 'noun', description: 'Từ loại.' },
      phonetics: {
        type: 'array',
        items: { $ref: '#/components/schemas/CardPhonetic' },
        description: 'Danh sách phiên âm và audio.',
      },
      translation: {
        type: 'string',
        example: 'gia đình',
        description: 'Nghĩa tiếng Việt.',
      },
      explanation: {
        type: 'object',
        properties: {
          vi: {
            type: 'string',
            example: 'Những người có quan hệ huyết thống hoặc sống chung.',
          },
          en: { type: 'string', example: 'A group of related people.' },
        },
        description: 'Giải nghĩa chi tiết.',
      },
      examples: {
        type: 'object',
        properties: {
          vi: { type: 'string', example: 'Gia đình tôi có bốn người.' },
          en: { type: 'string', example: 'My family has four people.' },
        },
        description: 'Câu ví dụ.',
      },
      imageUrl: {
        type: 'string',
        example: 'https://example.com/images/family.jpg',
        description: 'Ảnh minh họa.',
      },
      order: {
        type: 'integer',
        example: 5,
        description: 'Thứ tự hiển thị.',
      },
    },
  },
  CardReorderPayload: {
    type: 'object',
    required: ['cards'],
    properties: {
      cards: {
        type: 'array',
        description: 'Mảng các cards kèm thứ tự mới',
        items: {
          type: 'object',
          required: ['cardId', 'order'],
          properties: {
            cardId: { type: 'string', example: '665f1f77bcf86cd799439041' },
            order: { type: 'integer', example: 1 },
          },
        },
      },
    },
  },
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'ObjectId',
        example: '6a3201fc7ba6fde4b150c153',
      },
      email: {
        type: 'string',
        example: 'vlkduy2005@gmail.com',
      },
      name: {
        type: 'string',
        example: 'Khanh Duy Vo Le',
      },
      avatarUrl: {
        type: 'string',
        example:
          'https://minlish-english-learning.s3.us-east-1.amazonaws.com/3df0455f43d9240c5928f61b73faa48996d97fdc963e96e20ef9cdd3a5bac6d9',
      },
      isVerified: {
        type: 'boolean',
        example: true,
      },
      isActive: {
        type: 'boolean',
        example: true,
      },
      banReason: {
        type: 'string',
        example: '',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-06-17T02:10:04.078+00:00',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-06-22T04:35:14.781+00:00',
      },
    },
  },
  UsersResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'USER_LIST_SUCCESS' },
      message: { type: 'string', example: 'Users retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              totalItems: {
                type: 'integer',
                example: 100,
              },
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              totalPages: {
                type: 'integer',
                example: 10,
              },
            },
          },
        },
      },
    },
  },
  UserResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'USER_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'User detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/User',
      },
    },
  },
};
