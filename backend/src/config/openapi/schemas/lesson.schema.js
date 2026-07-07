export default {
  Lesson: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439013',
      },
      title: {
        type: 'string',
        example: 'Daily Conversation: Ordering Coffee',
      },
      slug: {
        type: 'string',
        example: 'daily-conversation-ordering-coffee',
      },
      description: {
        type: 'string',
        example:
          'Practice dictation and shadowing with a short coffee shop conversation.',
      },
      tagIds: {
        type: 'array',
        items: {
          type: 'string',
          example: '665f1f77bcf86cd799439011',
        },
      },
      cefrLevelIds: {
        type: 'array',
        items: {
          type: 'string',
          example: '665f1f77bcf86cd799439012',
        },
      },
      modes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['dictation', 'shadowing'],
        },
        example: ['dictation', 'shadowing'],
      },
      status: {
        type: 'string',
        enum: ['draft', 'published', 'archived'],
        example: 'published',
      },
      publishedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-06-12T03:30:00.000Z',
      },
      sourceUrl: {
        type: 'string',
        example: 'https://example.com/audio/coffee.mp3',
      },
      thumbnailUrl: {
        type: 'string',
        example: 'https://example.com/images/coffee.jpg',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  UserLessonProgress: {
    type: 'object',
    nullable: true,
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439021',
      },
      userId: {
        type: 'string',
        example: '665f1f77bcf86cd799439020',
      },
      lessonId: {
        type: 'string',
        example: '665f1f77bcf86cd799439013',
      },
      dictation: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['in_progress', 'completed'],
            example: 'in_progress',
          },
          progressPct: {
            type: 'number',
            example: 0,
          },
          lastStartMs: {
            type: 'integer',
            example: 0,
          },
        },
      },
      shadowing: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['in_progress', 'completed'],
            example: 'in_progress',
          },
          progressPct: {
            type: 'number',
            example: 0,
          },
          lastStartMs: {
            type: 'integer',
            example: 0,
          },
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  LessonItem: {
    type: 'object',
    properties: {
      lesson: {
        $ref: '#/components/schemas/Lesson',
      },
      userProgress: {
        $ref: '#/components/schemas/UserLessonProgress',
      },
    },
  },
  LessonListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'LESSON_LIST_SUCCESS' },
      message: {
        type: 'string',
        example: 'Lessons retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          lessons: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/LessonItem',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              totalItems: {
                type: 'integer',
                example: 42,
              },
              totalPages: {
                type: 'integer',
                example: 5,
              },
            },
          },
        },
      },
    },
  },
  LessonDetailResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'LESSON_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Lesson detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/LessonItem',
      },
    },
  },
  LessonSegment: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439014',
      },
      lessonId: {
        type: 'string',
        example: '665f1f77bcf86cd799439013',
      },
      startMs: {
        type: 'integer',
        example: 12500,
      },
      endMs: {
        type: 'integer',
        example: 18500,
      },
      transcript: {
        type: 'object',
        properties: {
          original: {
            type: 'string',
            example: 'Can I have a cup of coffee, please?',
          },
          normalized: {
            type: 'string',
            example: 'can i have a cup of coffee please',
          },
        },
      },
      translation: {
        type: 'string',
        example: 'Cho tôi một ly cà phê được không?',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  UserSegmentProgress: {
    type: 'object',
    nullable: true,
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439022',
      },
      userId: {
        type: 'string',
        example: '665f1f77bcf86cd799439020',
      },
      lessonId: {
        type: 'string',
        example: '665f1f77bcf86cd799439013',
      },
      segmentId: {
        type: 'string',
        example: '665f1f77bcf86cd799439014',
      },
      dictation: {
        type: 'object',
        properties: {
          attemptCount: { type: 'integer', example: 2 },
          bestScore: { type: 'number', example: 86 },
          completed: { type: 'boolean', example: true },
          hintUsedCount: { type: 'integer', example: 1 },
        },
      },
      shadowing: {
        type: 'object',
        properties: {
          attemptCount: { type: 'integer', example: 1 },
          bestScore: { type: 'number', example: 78 },
          latestAudioUrl: {
            type: 'string',
            example: 'https://example.com/uploads/shadowing.wav',
          },
          completed: { type: 'boolean', example: false },
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  LessonSegmentItem: {
    type: 'object',
    properties: {
      segment: {
        $ref: '#/components/schemas/LessonSegment',
      },
      userProgress: {
        $ref: '#/components/schemas/UserSegmentProgress',
      },
    },
  },
  LessonSegmentListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'SEGMENT_LIST_SUCCESS' },
      message: {
        type: 'string',
        example: 'Segments retrieved successfully',
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/LessonSegmentItem',
        },
      },
    },
  },
  LessonSegmentDetailResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'SEGMENT_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Segment detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/LessonSegmentItem',
      },
    },
  },
};
