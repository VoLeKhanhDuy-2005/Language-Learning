export default {
  Deck: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439031',
      },
      title: {
        type: 'string',
        example: 'Travel Vocabulary',
      },
      slug: {
        type: 'string',
        example: 'travel-vocabulary',
      },
      description: {
        type: 'string',
        example: 'Common English words and phrases for travel.',
      },
      coverImage: {
        type: 'string',
        example: 'https://example.com/images/travel.jpg',
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
      status: {
        type: 'string',
        enum: ['draft', 'published', 'archived'],
        example: 'draft',
      },
      ownerType: {
        type: 'string',
        enum: ['system', 'user'],
        example: 'system',
      },
      ownerId: {
        type: 'string',
        nullable: true,
        example: null,
      },
      topicCount: {
        type: 'integer',
        example: 8,
      },
      cardCount: {
        type: 'integer',
        example: 120,
      },
      publishedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-06-12T03:30:00.000Z',
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
  DeckListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'DECK_LIST_SUCCESS' },
      message: {
        type: 'string',
        example: 'Decks retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          decks: {
            type: 'array',
            description:
              'Nếu không đăng nhập: deck hệ thống đã công khai. Nếu đăng nhập: deck hệ thống đã công khai và deck của người dùng hiện tại.',
            items: {
              $ref: '#/components/schemas/Deck',
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
  DeckDetailResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'DECK_DETAIL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Deck detail retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/Deck',
      },
    },
  },
  Topic: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439041',
      },
      deckId: {
        type: 'string',
        example: '665f1f77bcf86cd799439031',
      },
      name: {
        type: 'string',
        example: 'Family',
      },
      slug: {
        type: 'string',
        example: 'family',
      },
      order: {
        type: 'integer',
        example: 1,
      },
      cardCount: {
        type: 'integer',
        example: 49,
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
  UserTopicProgress: {
    type: 'object',
    properties: {
      learnedCardCount: {
        type: 'integer',
        example: 1,
      },
      totalCardCount: {
        type: 'integer',
        example: 49,
      },
      progressPct: {
        type: 'number',
        example: 2,
      },
    },
  },
  DeckTopicItem: {
    type: 'object',
    properties: {
      topic: {
        $ref: '#/components/schemas/Topic',
      },
      userProgress: {
        $ref: '#/components/schemas/UserTopicProgress',
      },
    },
  },
  DeckTopicListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'DECK_TOPICS_SUCCESS' },
      message: {
        type: 'string',
        example: 'Deck topics retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          deck: {
            $ref: '#/components/schemas/Deck',
          },
          topics: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DeckTopicItem',
            },
          },
        },
      },
    },
  },
  CardPhonetic: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        example: '/ˈfæməli/',
      },
      audio: {
        type: 'string',
        example: 'https://example.com/audio/family-us.mp3',
      },
      locale: {
        type: 'string',
        example: 'en-US',
      },
    },
  },
  Card: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439051',
      },
      deckId: {
        type: 'string',
        example: '665f1f77bcf86cd799439031',
      },
      topicId: {
        type: 'string',
        example: '665f1f77bcf86cd799439041',
      },
      order: {
        type: 'integer',
        example: 1,
      },
      term: {
        type: 'string',
        example: 'family',
      },
      pos: {
        type: 'string',
        example: 'noun',
      },
      phonetics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CardPhonetic',
        },
      },
      translation: {
        type: 'string',
        example: 'gia đình',
      },
      explanation: {
        type: 'object',
        properties: {
          vi: {
            type: 'string',
            example: 'Những người có quan hệ huyết thống hoặc sống chung.',
          },
          en: {
            type: 'string',
            example: 'A group of related people.',
          },
        },
      },
      examples: {
        type: 'object',
        properties: {
          vi: {
            type: 'string',
            example: 'Gia đình tôi có bốn người.',
          },
          en: {
            type: 'string',
            example: 'My family has four people.',
          },
        },
      },
      imageUrl: {
        type: 'string',
        example: 'https://example.com/images/family.jpg',
      },
      quizOptions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            isCorrect: { type: 'boolean' },
          },
        },
        example: [
          { word: 'household', isCorrect: false },
          { word: 'extended family', isCorrect: false },
          { word: 'stepmother', isCorrect: true },
          { word: 'father-in-law', isCorrect: false },
        ],
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
  UserCardState: {
    type: 'object',
    nullable: true,
    properties: {
      _id: {
        type: 'string',
        example: '665f1f77bcf86cd799439061',
      },
      userId: {
        type: 'string',
        example: '665f1f77bcf86cd799439020',
      },
      cardId: {
        type: 'string',
        example: '665f1f77bcf86cd799439051',
      },
      deckId: {
        type: 'string',
        example: '665f1f77bcf86cd799439031',
      },
      topicId: {
        type: 'string',
        example: '665f1f77bcf86cd799439041',
      },
      srs: {
        type: 'object',
        properties: {
          easeFactor: {
            type: 'number',
            example: 2.5,
          },
          interval: {
            type: 'integer',
            example: 1,
          },
          lastGrade: {
            type: 'integer',
            example: 4,
          },
          nextReviewAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-13T03:30:00.000Z',
          },
        },
      },
      flags: {
        type: 'object',
        properties: {
          starred: {
            type: 'boolean',
            example: false,
          },
          hidden: {
            type: 'boolean',
            example: false,
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
  DeckTopicCardItem: {
    type: 'object',
    properties: {
      card: {
        $ref: '#/components/schemas/Card',
      },
      userCardState: {
        $ref: '#/components/schemas/UserCardState',
      },
    },
  },
  DeckTopicCardListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      code: { type: 'string', example: 'TOPIC_CARDS_SUCCESS' },
      message: {
        type: 'string',
        example: 'Topic cards retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DeckTopicCardItem',
            },
          },
        },
      },
    },
  },
};
