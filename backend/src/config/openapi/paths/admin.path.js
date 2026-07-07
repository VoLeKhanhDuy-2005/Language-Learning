const UserNotFound = {
  description: 'User not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    },
  },
};

const UserInvalidStatus = {
  description: 'Trạng thái không hợp lệ',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'INVALID_STATUS',
        message: 'Status must be active or banned',
        errors: [
          {
            field: 'status',
            message: 'Status must be active or banned',
          },
        ],
      },
    },
  },
};

const UserPasswordBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingPassword: {
          summary: 'Chưa nhập mật khẩu mới',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'newPassword',
                message: 'Please enter new password',
              },
            ],
          },
        },
        TooShort: {
          summary: 'Mật khẩu quá ngắn',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'newPassword',
                message: 'Password must be at least 6 characters',
              },
            ],
          },
        },
      },
    },
  },
};

const TagNotFound = {
  description: 'Tag not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      },
    },
  },
};

const LessonNotFound = {
  description: 'Lesson not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      },
    },
  },
};

const LessonTitleConflict = {
  description: 'The lesson title already exists',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'LESSON_TITLE_EXISTS',
        message:
          'The lesson title already exists in the system. Please adjust the title.',
      },
    },
  },
};

const LessonBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingTitleFields: {
          summary: 'The title field is required',
          value: {
            success: false,
            code: 'LESSON_TITLE_REQUIRED',
            message: 'The title field is required.',
          },
        },
        MissingSourceUrlFields: {
          summary: 'The sourceURL field is required',
          value: {
            success: false,
            code: 'LESSON_SOURCE_URL_REQUIRED',
            message: 'The sourceURL field is required.',
          },
        },
        InvalidSourceUrlFields: {
          summary: 'The sourceUrl must be a valid YouTube link',
          value: {
            success: false,
            code: 'LESSON_SOURCE_URL_INVALID',
            message: 'The sourceUrl must be a valid YouTube link.',
          },
        },
        DisabledPlaybackSourceUrlFields: {
          summary:
            'Video is unavailable. Video owner has disabled playback on other websites',
          value: {
            success: false,
            code: 'LESSON_SOURCE_URL_DISABLED_PLAYBACK',
            message:
              'Video is unavailable. Video owner has disabled playback on other websites',
          },
        },
        InvalidStatus: {
          summary: 'The status field must be draft, published or archived',
          value: {
            success: false,
            code: 'LESSON_STATUS_INVALID',
            message: 'The status field must be draft, published or archived.',
          },
        },
      },
    },
  },
};

const LessonOrSegmentNotFound = {
  description: 'Lesson not found hoặc segment',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        LessonNotFound: {
          summary: 'Lesson not found',
          value: {
            success: false,
            code: 'LESSON_NOT_FOUND',
            message: 'Lesson not found',
          },
        },
        SegmentNotFound: {
          summary: 'Segment not found',
          value: {
            success: false,
            code: 'SEGMENT_NOT_FOUND',
            message: 'Segment not found',
          },
        },
      },
    },
  },
};

const TagBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        value: {
          success: false,
          code: 'TAG_LABEL_REQUIRED',
          message: 'The label field is required',
        },
      },
    },
  },
};

const SegmentBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        SegmentTimeOverlaps: {
          summary:
            'The time allocated for this segment overlaps with that of other segments.',
          value: {
            success: false,
            code: 'SEGMENT_TIME_OVERLAPS',
            message:
              'The time allocated for this segment overlaps with that of other segments.',
          },
        },
        SegmentEndMsInvalid: {
          summary: 'The endMs field is mandatory, must be a number and >= 1s.',
          value: {
            success: false,
            code: 'SEGMENT_END_MS_INVALID',
            message:
              'The endMs field is mandatory, must be a number and >= 1s.',
          },
        },
        SegmentStartMsInvalid: {
          summary:
            'The startMs field is mandatory, must be a number and >= 0s.',
          value: {
            success: false,
            code: 'SEGMENT_START_MS_INVALID',
            message:
              'The startMs field is mandatory, must be a number and >= 0s.',
          },
        },
        SegmentEndMsLessThanStartMs: {
          summary: 'The endMs field must be larger than the startMs field.',
          value: {
            success: false,
            code: 'SEGMENT_END_MS_LESS_THAN_START_MS',
            message: 'The endMs field must be larger than the startMs field.',
          },
        },
        SegmentEndMsExceedsDuration: {
          summary:
            'The endMs field must not exceed the audio length of the lesson.',
          value: {
            success: false,
            code: 'SEGMENT_END_MS_EXCEEDS_DURATION',
            message:
              'The endMs field must not exceed the audio length of the lesson.',
          },
        },
        SegmentTranscriptOriginalRequired: {
          summary: 'The original field is required.',
          value: {
            success: false,
            code: 'SEGMENT_TRANSCRIPT_ORIGINAL_REQUIRED',
            message: 'The original field is required.',
          },
        },
        SegmentTranscriptNormalizedRequired: {
          summary: 'The normalized field is required.',
          value: {
            success: false,
            code: 'SEGMENT_TRANSCRIPT_NORMALIZED_REQUIRED',
            message: 'The normalized field is required.',
          },
        },
        SegmentTranslationRequired: {
          summary: 'The translation field is required.',
          value: {
            success: false,
            code: 'SEGMENT_TRANSLATION_REQUIRED',
            message: 'The translation field is required.',
          },
        },
      },
    },
  },
};

const TagConflict = {
  description: 'This tag label already exists',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        value: {
          success: false,
          code: 'TAG_LABEL_EXISTS',
          message: 'This tag label already exists',
        },
      },
    },
  },
};

const DeckBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        value: {
          success: false,
          code: 'DECK_TITLE_REQUIRED',
          message: 'The title field is required',
        },
      },
    },
  },
};

const DeckNotFound = {
  description: 'Deck not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'DECK_NOT_FOUND',
        message: 'Deck not found',
      },
    },
  },
};

const DeckSlugConflict = {
  description: 'The deck title already exists',
  content: {
    'application/json': {
      example: {
        value: {
          success: false,
          code: 'DECK_TITLE_EXISTS',
          message: 'Deck title already exists. Please change the title',
        },
      },
    },
  },
};

const DeckOrTopicNotFoundDistinct = {
  description: 'Deck or topic not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        DeckNotFound: {
          summary: 'Deck not found',
          value: {
            success: false,
            code: 'DECK_NOT_FOUND',
            message: 'Deck not found',
          },
        },
        TopicNotFound: {
          summary: 'Topic not found',
          value: {
            success: false,
            code: 'TOPIC_NOT_FOUND',
            message: 'Topic not found',
          },
        },
        // TopicNotInDeck: {
        //   summary: 'Topic does not belong to this deck',
        //   value: {
        //     success: false,
        //     code: 'INVALID_DATA',
        //     message: 'Topic is not belong to the selected deck',
        //   },
        // },
      },
    },
  },
};

const DeckOrTopicNotFound = {
  description: 'Deck or topic not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        value: {
          success: false,
          code: 'DECK_OR_TOPIC_NOT_FOUND',
          message: 'Deck or topic not found',
        },
      },
    },
  },
};

const TopicConflict = {
  description: 'Duplicate data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'TOPIC_SLUG_EXISTS',
        message: 'Topic slug already exists. Please change the slug or title',
        errors: [
          {
            field: 'slug',
            message:
              'Topic slug already exists. Please change the slug or title',
          },
        ],
      },
    },
  },
};

const TopicBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        summary: 'The name field is required',
        value: {
          success: false,
          code: 'TOPIC_NAME_REQUIRED',
          message: 'The name field is required',
          errors: [{ field: 'name', message: 'The name field is required' }],
        },
      },
    },
  },
};

const TopicReorderBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingFields: {
          summary: 'Missing field or invalid field',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topics',
                message: 'The topics field must be a non-empty array',
              },
              {
                field: 'topics[0].topicId',
                message: 'The topicId field is required',
              },
              {
                field: 'topics[0].order',
                message:
                  'The order field is required and must be an integer >= 1',
              },
            ],
          },
        },
        DuplicateOrderInArray: {
          summary: 'Duplicate order found in the list',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topics[1].order',
                message: 'Duplicate order found in the list',
              },
            ],
          },
        },
        DuplicateTopicIdInArray: {
          summary: 'Duplicate topicId found in the list',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topics[1].topicId',
                message: 'Duplicate topicId found in the list',
              },
            ],
          },
        },
      },
    },
  },
};

const TopicNotFound = {
  description: 'Không tìm thấy topic',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'TOPIC_NOT_FOUND',
        message: 'Topic not found',
      },
    },
  },
};

const DeckOrCardNotFound = {
  description: 'Deck or card not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'DECK_OR_CARD_NOT_FOUND',
        message: 'Deck or card not found',
      },
    },
  },
};

const CardNotFound = {
  description: 'Card not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'CARD_NOT_FOUND',
        message: 'Card not found',
      },
    },
  },
};

const CardBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingFields: {
          summary: 'Missing require field',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              { field: 'topicId', message: 'The topicId field is required' },
              { field: 'term', message: 'The term field is required' },
              { field: 'pos', message: 'The pos field is required' },
              {
                field: 'translation',
                message: 'The translation field is required',
              },
            ],
          },
        },
        InvalidTopicInDeck: {
          summary: 'Topic does not belong to this deck',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topicId',
                message: 'Topic does not belong to this deck',
              },
            ],
          },
        },
      },
    },
  },
};

const CardReorderBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingFields: {
          summary: 'Missing field or invalid field',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'cards',
                message: 'The cards field must be a non-empty array',
              },
              {
                field: 'cards[0].cardId',
                message: 'The cardId field is required',
              },
              {
                field: 'cards[0].order',
                message:
                  'The order field is required and must be an integer >= 1',
              },
            ],
          },
        },
        DuplicateOrderInArray: {
          summary: 'Trùng lặp order trong mảng',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topics',
                message: 'Duplicate order found in the list',
              },
            ],
          },
        },
        InvalidTopicInDeck: {
          summary: 'Topic does not belong to this deck',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'topics[0].topicId',
                message: 'Topic does not belong to this deck',
              },
            ],
          },
        },
      },
    },
  },
};

const ImportCardBadRequest = {
  description: 'Invalid input data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingFileKey: {
          summary: 'Thiếu fileUrl',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [{ field: 'fileUrl', message: 'fileUrl is required' }],
          },
        },
        InvalidMode: {
          summary: 'Mode không hợp lệ',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'mode',
                message: 'mode must be one of: append, replace, upsert',
              },
            ],
          },
        },
      },
    },
  },
};

export default {
  '/admin/dashboard': {
    get: {
      tags: ['Admin dashboard'],
      summary: 'Lấy các số liệu thống kê cho dashboard',
      description:
        'Lấy các số liệu tổng quan như số người dùng, người dùng hoạt động, bài học, bộ từ vựng, biểu đồ người dùng 6 tháng gần đây, các bài học/bộ từ vựng phổ biến và mới nhất.',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard metrics retrieved successfully',
          content: {
            'application/json': {
              example: {
                success: true,
                code: 'DASHBOARD_METRICS_SUCCESS',
                message: 'Dashboard metrics retrieved successfully',
                data: {
                  totalUsers: 34,
                  activeUsers: 33,
                  totalLessons: 34,
                  totalDecks: 8,
                  userRegistrationChart6Months: [
                    { label: '1/2026', count: 1 },
                    { label: '2/2026', count: 0 },
                    { label: '3/2026', count: 0 },
                    { label: '4/2026', count: 0 },
                    { label: '5/2026', count: 2 },
                    { label: '6/2026', count: 31 },
                  ],
                  userRegistrationChart12Months: [
                    { label: '7/2025', count: 0 },
                    { label: '8/2025', count: 0 },
                    { label: '9/2025', count: 0 },
                    { label: '10/2025', count: 0 },
                    { label: '11/2025', count: 0 },
                    { label: '12/2025', count: 0 },
                    { label: '1/2026', count: 1 },
                    { label: '2/2026', count: 0 },
                    { label: '3/2026', count: 0 },
                    { label: '4/2026', count: 0 },
                    { label: '5/2026', count: 2 },
                    { label: '6/2026', count: 31 },
                  ],
                  popularLessons: [
                    {
                      userCount: 6,
                      _id: '69c79cd3d9501970bf0c23b3',
                      title:
                        'How To Plant a Tree (While Two Grown Men Try to Climb You) - Moving Mind Studio',
                      slug: 'how-to-plant-a-tree-while-two-grown-men-try-to-climb-you-moving-mind-studio',
                      thumbnailUrl:
                        'https://img.youtube.com/vi/7blGR9KxTGY/0.jpg',
                    },
                    {
                      userCount: 3,
                      _id: '69c79bf5d9501970bf0bc814',
                      title: 'How to Cut Rope in an Emergency',
                      slug: 'how-to-cut-rope-in-an-emergency',
                      thumbnailUrl:
                        'https://img.youtube.com/vi/eCNwxqP7l44/0.jpg',
                    },
                    {
                      userCount: 3,
                      _id: '69c53f0ac160bb412e9b1b97',
                      title: 'What Is a Sandwich?',
                      slug: 'what-is-a-sandwich',
                      thumbnailUrl:
                        'https://img.youtube.com/vi/qDSPDOe7LJg/0.jpg',
                    },
                    {
                      userCount: 2,
                      _id: '689cba35186a4c2f57f75dbe',
                      title: 'English in a Minute: Zone Out',
                      slug: 'english-in-a-minute-zone-out',
                      thumbnailUrl:
                        'https://img.youtube.com/vi/qFhCU9UWbq8/0.jpg',
                    },
                    {
                      userCount: 2,
                      _id: '689cba28186a4c2f57f75d15',
                      title: 'English in a Minute: Play Up',
                      slug: 'english-in-a-minute-play-up',
                      thumbnailUrl:
                        'https://img.youtube.com/vi/bLYdr5T55aY/0.jpg',
                    },
                  ],
                  popularDecks: [
                    {
                      _id: '6a12ea606d2bf0df8c442399',
                      title: 'Essential Words for the TOEFL',
                      slug: 'essential-words-for-the-toefl',
                      coverImage:
                        'https://assets.parroto.app/assets/decks/6900e0eff1a22d0de4fe6d74/thumbnail-RFpNacsQ68FdXjCM-4X1d.jpg',
                      cardCount: 529,
                    },
                    {
                      _id: '6a12ea606d2bf0df8c442394',
                      title: '600 basic IELTS vocabulary',
                      slug: '600-basic-ielts-vocabulary',
                      coverImage:
                        'https://assets.parroto.app/assets/decks/68fb9444c82801c32077e73e/thumbnail-TPgsVZ-s4SXFL3s0ie7EL.jpg',
                      cardCount: 599,
                    },
                    {
                      _id: '6a12ea5e6d2bf0df8c442389',
                      title: '1000 common English words',
                      slug: '1000-common-english-words',
                      coverImage:
                        'https://assets.parroto.app/assets/decks/68f46a24b79f2226f4ef9491/thumbnail-OQPDM-w_9HqmPWniWj8Dg.webp',
                      cardCount: 992,
                    },
                    {
                      _id: '6a12ea5f6d2bf0df8c442391',
                      title: '600 essential words for the TOEIC',
                      slug: '600-essential-words-for-the-toeic',
                      coverImage:
                        'https://assets.parroto.app/assets/decks/68f2173c5e2ac8381d780dc8/thumbnail-AFWd3rdTW4-uHJZoOJBYr.webp',
                      cardCount: 622,
                    },
                    {
                      _id: '6a12ea5f6d2bf0df8c44238c',
                      title: '3000 Oxford Vocabulary A2',
                      slug: '3000-oxford-vocabulary-a2',
                      coverImage:
                        'https://assets.parroto.app/assets/decks/691c160fd3a2e879f9c6b103/thumbnail-sxNAh58W-l-gFEQ2Hpr2K.webp',
                      cardCount: 827,
                    },
                  ],
                  recentContent: {
                    lessons: [
                      {
                        _id: '6a3ff199cda51e03d7a01c6e',
                        title: 'good',
                        slug: 'good',
                        status: 'draft',
                        createdAt: '2026-06-27T15:51:53.666Z',
                      },
                      {
                        _id: '6a3ff169cda51e03d7a01c5b',
                        title: 'Good night',
                        slug: 'good-night',
                        status: 'draft',
                        createdAt: '2026-06-27T15:51:05.089Z',
                      },
                      {
                        _id: '6a3fd647c7a344f40415223e',
                        title: 'test 1',
                        slug: 'test-1',
                        status: 'archived',
                        createdAt: '2026-06-27T13:55:19.028Z',
                      },
                      {
                        _id: '6a3d4c65ec7c2e04a6e0491a',
                        title: 'Good luck',
                        slug: 'good-luck',
                        status: 'draft',
                        createdAt: '2026-06-25T15:42:29.667Z',
                      },
                      {
                        _id: '68c0fc86ca0b3e86dd919972',
                        title:
                          'Vietnam’s bank risk rating upgraded | Vietnam Today',
                        slug: 'vietnams-bank-risk-rating-upgraded-vietnam-today',
                        status: 'published',
                        createdAt: '2026-06-15T11:48:41.225Z',
                      },
                    ],
                    decks: [
                      {
                        _id: '6a3e66f82800ca30bf6fe8cf',
                        title: 'test',
                        slug: 'test',
                        status: 'draft',
                        createdAt: '2026-06-26T11:48:08.261Z',
                      },
                      {
                        _id: '6a12ea606d2bf0df8c442399',
                        title: 'Essential Words for the TOEFL',
                        slug: 'essential-words-for-the-toefl',
                        status: 'published',
                        createdAt: '2026-06-15T11:07:22.828Z',
                      },
                      {
                        _id: '6a12ea5f6d2bf0df8c44238a',
                        title: 'Conversational English Vocabulary',
                        slug: 'conversational-english-vocabulary',
                        status: 'published',
                        createdAt: '2026-06-15T11:07:22.828Z',
                      },
                      {
                        _id: '6a12ea5f6d2bf0df8c44238b',
                        title: '3000 Oxford Vocabulary A1',
                        slug: '3000-oxford-vocabulary-a1',
                        status: 'published',
                        createdAt: '2026-06-15T11:07:22.828Z',
                      },
                      {
                        _id: '6a12ea5e6d2bf0df8c442389',
                        title: '1000 common English words',
                        slug: '1000-common-english-words',
                        status: 'published',
                        createdAt: '2026-06-15T11:07:22.828Z',
                      },
                    ],
                  },
                },
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
  '/admin/tags': {
    get: {
      tags: ['Admin tags'],
      summary: 'Lấy danh sách tag',
      description: 'Lấy toàn bộ danh sách tag dành cho Admin.',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Tags retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TagsResponse',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin tags'],
      summary: 'Tạo tag mới',
      description: 'Tạo mới một tag dành cho Admin.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TagPayload',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Tags created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/TagResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Tags created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: TagBadRequest,
        409: TagConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/tags/{id}': {
    get: {
      tags: ['Admin tags'],
      summary: 'Lấy chi tiết một Tag',
      description: 'Lấy thông tin chi tiết một tag dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'ID của Tag',
        },
      ],
      responses: {
        200: {
          description: 'Tag detail retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TagResponse',
              },
            },
          },
        },
        404: TagNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin tags'],
      summary: 'Cập nhật Tag',
      description: 'Cập nhật thông tin tag dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'ID của Tag',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TagPayload',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Tag updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/TagResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Tag updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: TagBadRequest,
        409: TagConflict,
        404: TagNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin tags'],
      summary: 'Xóa tag',
      description: 'Xóa tag dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'ID của Tag',
        },
      ],
      responses: {
        200: {
          description: 'Tag deleted successfully',
          content: {
            'application/json': {
              example: {
                success: true,
                code: 'TAG_DELETED_SUCCESS',
                message: 'Tag deleted successfully',
              },
            },
          },
        },
        404: TagNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/lessons': {
    get: {
      tags: ['Admin lessons'],
      summary: 'Lấy danh sách lessons',
      description:
        'Lấy danh sách tất cả lessons dành cho Admin. Hỗ trợ phân trang và tìm kiếm.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['draft', 'published', 'archived'] },
          description: 'Lọc theo trạng thái',
        },
        {
          in: 'query',
          name: 'tagId',
          schema: { type: 'string' },
          description: 'Lọc theo tag',
        },
        {
          in: 'query',
          name: 'cefrLevelId',
          schema: { type: 'string' },
          description: 'Lọc theo CEFR level',
        },
        {
          in: 'query',
          name: 'mode',
          schema: { type: 'string', enum: ['dictation', 'shadowing'] },
          description: 'Lọc theo chế độ học',
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'Tìm kiếm theo từ khóa (tiêu đề, mô tả)',
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Trang hiện tại',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Số lượng bài học trên mỗi trang',
        },
      ],
      responses: {
        200: {
          description: 'Lessons retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LessonsResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin lessons'],
      summary: 'Tạo lesson mới',
      description: 'Tạo mới một lesson. Mặc định trạng thái là draft.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LessonPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Lesson created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/LessonResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Lesson created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: LessonBadRequest,
        409: LessonTitleConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/lessons/{lessonId}': {
    get: {
      tags: ['Admin lessons'],
      summary: 'Lấy chi tiết một lesson',
      description: 'Lấy thông tin chi tiết một lesson bất kể trạng thái.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
      ],
      responses: {
        200: {
          description: 'Lesson detail retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LessonResponse' },
            },
          },
        },
        404: LessonNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin lessons'],
      summary: 'Cập nhật lesson',
      description: 'Cập nhật thông tin của lesson.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LessonPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Lesson updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/LessonResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Lesson updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: LessonBadRequest,
        404: LessonNotFound,
        409: LessonTitleConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin lessons'],
      summary: 'Xóa hoặc archive lesson',
      description: 'Xóa mềm hoặc chuyển trạng thái lesson sang archived.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
      ],
      responses: {
        200: {
          description: 'Lesson deleted/archived successfully',
          content: {
            'application/json': {
              example: {
                success: true,
                code: 'LESSON_DELETED_SUCCESS',
                message: 'Lesson deleted/archived successfully',
              },
            },
          },
        },
        404: LessonNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/lessons/{lessonId}/segments': {
    get: {
      tags: ['Admin lesson segments'],
      summary: 'Lấy danh sách segment của lesson',
      description:
        'Lấy danh sách các segment thuộc về một lesson cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
      ],
      responses: {
        200: {
          description: 'Lấy danh sách segments thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SegmentsResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin lesson segments'],
      summary: 'Tạo segment mới',
      description: 'Tạo mới một segment cho một lesson cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SegmentPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Segment created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SegmentResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Segment created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: SegmentBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/lessons/{lessonId}/segments/{segmentId}': {
    get: {
      tags: ['Admin lesson segments'],
      summary: 'Lấy chi tiết một segment',
      description:
        'Lấy thông tin chi tiết của một segment cụ thể trong một lesson cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
        {
          in: 'path',
          name: 'segmentId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của segment',
        },
      ],
      responses: {
        200: {
          description: 'Segment detail retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SegmentResponse' },
            },
          },
        },
        404: LessonOrSegmentNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin lesson segments'],
      summary: 'Cập nhật segment',
      description:
        'Cập nhật thông tin segment cụ thể trong một lesson cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
        {
          in: 'path',
          name: 'segmentId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của segment',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SegmentPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Segment updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SegmentResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Segment updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: SegmentBadRequest,
        404: LessonOrSegmentNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin lesson segments'],
      summary: 'Delete lesson segment',
      description: 'Delete lesson segment for Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của lesson',
        },
        {
          in: 'path',
          name: 'segmentId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của segment',
        },
      ],
      responses: {
        200: {
          description: 'Segment deleted successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'SEGMENT_DELETED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Segment deleted successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        404: LessonOrSegmentNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks': {
    get: {
      tags: ['Admin decks'],
      summary: 'Lấy danh sách decks',
      description:
        'Lấy danh sách tất cả bộ thẻ hệ thống (system decks - có "ownerId": null) dành cho Admin. Hỗ trợ phân trang và tìm kiếm.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'tagId',
          schema: { type: 'string' },
          description: 'Lọc theo tag',
        },
        {
          in: 'query',
          name: 'cefrLevelId',
          schema: { type: 'string' },
          description: 'Lọc theo CEFR level',
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'Tìm kiếm theo từ khóa (tiêu đề, mô tả)',
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['draft', 'published', 'archived'] },
          description: 'Lọc theo trạng thái',
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Trang hiện tại',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Số lượng bộ thẻ trên mỗi trang',
        },
      ],
      responses: {
        200: {
          description: 'Decks retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeckListResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin decks'],
      summary: 'Tạo deck mới',
      description: 'Tạo mới deck. Mặc định trạng thái là draft.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DeckPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Deck created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/DeckDetailResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Deck created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: DeckBadRequest,
        409: DeckSlugConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}': {
    get: {
      tags: ['Admin decks'],
      summary: 'Lấy chi tiết một deck',
      description: 'Lấy thông tin chi tiết một deck bất kể trạng thái.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      responses: {
        200: {
          description: 'Deck detail retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeckDetailResponse' },
            },
          },
        },
        404: DeckNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin decks'],
      summary: 'Cập nhật deck',
      description: 'Cập nhật thông tin của một deck.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DeckPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Deck updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/DeckDetailResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Deck updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: DeckBadRequest,
        404: DeckNotFound,
        409: DeckSlugConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin decks'],
      summary: 'Xóa mềm deck',
      description: 'Chuyển trạng thái deck sang archived thay vì xóa cứng.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      responses: {
        200: {
          description: 'Xóa deck thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        404: DeckNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/topics': {
    get: {
      tags: ['Admin topics'],
      summary: 'Lấy danh sách topic của deck',
      description:
        'Lấy danh sách các topic thuộc về một deck cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      responses: {
        200: {
          description: 'Topics retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TopicsResponse' },
            },
          },
        },
        404: DeckNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin topics'],
      summary: 'Tạo topic mới',
      description: 'Tạo mới một topic cho một deck cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TopicPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Topic created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/TopicResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'TOPIC_CREATED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Topic created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: TopicBadRequest,
        409: TopicConflict,
        404: DeckNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/topics/reorder': {
    patch: {
      tags: ['Admin topics'],
      summary: 'Sắp xếp lại các topic',
      description: 'Cập nhật lại order của nhiều topics cùng lúc trong deck.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TopicReorderPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Topics reordered successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'TOPIC_REORDERED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Topics reordered successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        404: DeckNotFound,
        400: TopicReorderBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/topics/{topicId}': {
    get: {
      tags: ['Admin topics'],
      summary: 'Lấy chi tiết một topic',
      description:
        'Lấy thông tin chi tiết của một topic cụ thể trong một deck cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic',
        },
      ],
      responses: {
        200: {
          description: 'Topic detail retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TopicResponse' },
            },
          },
        },
        404: DeckOrTopicNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin topics'],
      summary: 'Cập nhật topic',
      description:
        'Cập nhật thông tin topic trong một deck cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TopicPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Topic updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/TopicResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'TOPIC_UPDATED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Topic updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: TopicBadRequest,
        404: DeckOrTopicNotFound,
        409: TopicConflict,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin topics'],
      summary: 'Xóa topic khỏi deck',
      description: 'Xóa topic khỏi deck dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic',
        },
      ],
      responses: {
        200: {
          description: 'Topic deleted successfully',
          content: {
            'application/json': {
              example: {
                  success: true,
                  code: 'TOPIC_DELETED_SUCCESS',
                  message: 'Topic deleted successfully',
              },
            },
          },
        },
        404: DeckOrTopicNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/cards': {
    get: {
      tags: ['Admin cards'],
      summary: 'Lấy danh sách card của deck',
      description:
        'Lấy danh sách các card thuộc về một deck cụ thể dành cho Admin. Hỗ trợ lọc theo topicId, q, page, limit, pos.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'query',
          name: 'topicId',
          schema: { type: 'string' },
          description: 'Lọc theo topic',
        },
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'Tìm kiếm theo từ khóa (term, translation)',
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Trang hiện tại',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Số lượng card trên mỗi trang',
        },
        {
          in: 'query',
          name: 'pos',
          schema: { type: 'string' },
          description: 'Loại từ (verb, noun, ...)',
        },
      ],
      responses: {
        200: {
          description: 'Cards retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CardsResponse' },
            },
          },
        },
        404: DeckNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      tags: ['Admin cards'],
      summary: 'Tạo card mới',
      description:
        'Tạo mới một card cho một deck và topic cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CardPayload' },
          },
        },
      },
      responses: {
        201: {
          description: 'Card created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/CardResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Card created successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: CardBadRequest,
        404: DeckOrTopicNotFoundDistinct,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/cards/{cardId}': {
    get: {
      tags: ['Admin cards'],
      summary: 'Lấy chi tiết một card',
      description: 'Lấy thông tin chi tiết của một card cụ thể dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'cardId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của card',
        },
      ],
      responses: {
        200: {
          description: 'Card detail retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CardResponse' },
            },
          },
        },
        404: CardNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      tags: ['Admin cards'],
      summary: 'Cập nhật card',
      description:
        'Cập nhật thông tin card (term, translation, pos, explanation, ...).',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'cardId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của card',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CardPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Card updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/CardResponse' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Card updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: CardBadRequest,
        404: DeckOrCardNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      tags: ['Admin cards'],
      summary: 'Xóa card',
      description: 'Xóa card khỏi deck dành cho Admin.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'cardId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của card',
        },
      ],
      responses: {
        200: {
          description: 'Xóa card thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        404: DeckOrCardNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/topics/{topicId}/cards/reorder': {
    patch: {
      tags: ['Admin cards'],
      summary: 'Sắp xếp lại các cards',
      description: 'Cập nhật lại order của nhiều cards cùng lúc trong topic.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CardReorderPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Sắp xếp cards thành công',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'CARD_REORDERED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Cards reordered successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        404: TopicNotFound,
        400: CardReorderBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin users'],
      summary: 'Lấy danh sách người dùng',
      description: 'Lấy danh sách người dùng dành cho Admin',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'q',
          schema: { type: 'string' },
          description: 'Từ khóa tìm kiếm (email, tên)',
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Số trang',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Số lượng / trang',
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['active', 'banned', 'unverified'] },
          description: 'Lọc theo trạng thái tài khoản',
        },
      ],
      responses: {
        200: {
          description: 'Lấy danh sách thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UsersResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/users/{userId}': {
    get: {
      tags: ['Admin users'],
      summary: 'Lấy thông tin tài khoản người dùng',
      description: 'Lấy thông tin chi tiết tài khoản người dùng dành cho Admin',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'ID người dùng',
        },
      ],
      responses: {
        200: {
          description: 'Lấy chi tiết user thành công',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: UserNotFound,
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    patch: {
      tags: ['Admin users'],
      summary: 'Đổi mật khẩu người dùng',
      description: 'Đổi mật khẩu của người dùng dành cho Admin',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'ID người dùng',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newPassword'],
              properties: {
                newPassword: {
                  type: 'string',
                  minLength: 8,
                  example: 'Duy!2005#',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Đổi mật khẩu thành công',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'USER_PASSWORD_CHANGED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Password changed successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: UserPasswordBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        404: UserNotFound,
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/users/{userId}/status': {
    patch: {
      tags: ['Admin users'],
      summary: 'Khóa / mở khóa tài khoản người dùng',
      description:
        'Khóa hoặc mở khóa tài khoản người dùng dành cho Admin (đổi trạng thái sang banned/active)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string' },
          description: 'ID người dùng',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'banned'],
                  description:
                    'Trạng thái tài khoản. active: hoạt động, banned: bị khóa',
                },
                banReason: {
                  type: 'string',
                  description: 'Lý do khóa tài khoản',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Cập nhật trạng thái thành công',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'USER_STATUS_UPDATED_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'User status updated successfully',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: UserInvalidStatus,
        401: { $ref: '#/components/responses/Unauthorized' },
        404: UserNotFound,
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/topics/{topicId}/export': {
    get: {
      tags: ['Admin cards'],
      summary: 'Export cards của một topic ra file Excel',
      description:
        'Xuất toàn bộ cards của một topic thành file Excel (.xlsx) để tải về. Các cột bao gồm: term, translation, pos, phonetics, explanation_vi, explanation_en, examples_vi, examples_en, imageUrl.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic cần export',
        },
      ],
      responses: {
        200: {
          description: 'Trả về file Excel chứa danh sách cards',
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: DeckOrTopicNotFound,
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/admin/decks/{deckId}/topics/{topicId}/import': {
    post: {
      tags: ['Admin cards'],
      summary: 'Import cards vào một topic từ file Excel trên S3',
      description: `Nhập cards từ file Excel (.xlsx) đã được upload lên S3 thông qua presigned URL.

**Flow:**
1. Gọi \`POST /file/presigned-url\` với \`{ purpose: "deck-import", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: ... }\`
2. Upload file Excel lên S3 qua \`uploadUrl\` nhận được
3. Gọi endpoint này với \`fileKey\` (key trả về ở bước 1) và \`mode\`

**Định dạng file Excel (header dòng 1):** \`term\` \`translation\` \`pos\` \`phonetics\` \`explanation_vi\` \`explanation_en\` \`examples_vi\` \`examples_en\` \`imageUrl\`
- Các cột bắt buộc phải có để import thành công: term và translation

**Các mode:**
- \`append\` – Chỉ thêm các term chưa tồn tại, bỏ qua nếu đã có.
- \`replace\` – Xóa toàn bộ cards cũ rồi insert lại từ file.
- \`upsert\` – Cập nhật nếu term đã tồn tại, thêm mới nếu chưa có.`,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'deckId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của deck',
        },
        {
          in: 'path',
          name: 'topicId',
          required: true,
          schema: { type: 'string' },
          description: 'ID của topic cần import vào',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fileUrl', 'mode'],
              properties: {
                fileUrl: {
                  type: 'string',
                  format: 'uri',
                  description:
                    'URL công khai (S3) của file Excel đã upload (lấy từ trường `url` khi gọi presigned-url API)',
                  example:
                    'https://minlish-english-learning.s3.us-east-1.amazonaws.com/imports/665f.../abc123.xlsx',
                },
                mode: {
                  type: 'string',
                  enum: ['append', 'replace', 'upsert'],
                  description: 'Chế độ import',
                  example: 'upsert',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Import thành công, trả về summary kết quả',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  code: { type: 'string', example: 'CARD_IMPORT_SUCCESS' },
                  message: {
                    type: 'string',
                    example: 'Cards imported successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      cardsProcessed: {
                        type: 'integer',
                        example: 42,
                        description: 'Số lượng thao tác bulkWrite thực hiện',
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalRows: { type: 'integer', example: 50 },
                          inserted: { type: 'integer', example: 30 },
                          updated: { type: 'integer', example: 10 },
                          skipped: { type: 'integer', example: 8 },
                          failed: { type: 'integer', example: 2 },
                          mode: { type: 'string', example: 'upsert' },
                          errors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                row: { type: 'integer', example: 5 },
                                reason: {
                                  type: 'string',
                                  example: 'Thiếu cột bắt buộc: translation',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: ImportCardBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: DeckOrTopicNotFound,
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
