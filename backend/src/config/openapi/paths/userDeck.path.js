import { bearerAuth } from '../helpers/security.js';

const deckIdParam = {
  name: 'deckId',
  in: 'path',
  required: true,
  description: 'ObjectId của deck thuộc sở hữu người dùng.',
  schema: {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$',
    example: '665f1f77bcf86cd799439031',
  },
};

const topicIdParam = {
  name: 'topicId',
  in: 'path',
  required: true,
  description: 'ObjectId của topic.',
  schema: {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$',
    example: '665f1f77bcf86cd799439041',
  },
};

const cardIdParam = {
  name: 'cardId',
  in: 'path',
  required: true,
  description: 'ObjectId của card.',
  schema: {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$',
    example: '665f1f77bcf86cd799439051',
  },
};

const pageParam = {
  name: 'page',
  in: 'query',
  required: false,
  description: 'Số trang cần lấy.',
  schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
};

const limitParam = {
  name: 'limit',
  in: 'query',
  required: false,
  description: 'Số lượng item trên mỗi trang.',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  },
};

const qParam = {
  name: 'q',
  in: 'query',
  required: false,
  description: 'Từ khóa tìm kiếm.',
  schema: { type: 'string', example: 'family' },
};

const simpleSuccess = (code, message) => ({
  description: message,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/SuccessResponse' },
      example: { success: true, code, message },
    },
  },
});

const NotFound = (message, code = 'NOT_FOUND') => ({
  description: message,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { success: false, code, message },
    },
  },
});

const jsonBody = (ref) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${ref}` },
    },
  },
});

const jsonResponse = (ref, description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${ref}` },
    },
  },
});

const jsonResponseWithCode = (ref, description, code, message) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${ref}` },
      example: { success: true, code, message },
    },
  },
});

const TAG = 'User Deck';

export default {
  // ==================== DECK ====================
  '/users/me/decks': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy danh sách deck của người dùng hiện tại',
      description:
        'Trả về danh sách deck do người dùng hiện tại sở hữu (ownerType = user). Yêu cầu đăng nhập bằng Bearer token.',
      parameters: [qParam, pageParam, limitParam],
      responses: {
        200: jsonResponse(
          'UserDeckListResponse',
          'Lấy danh sách deck thành công.'
        ),
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Tạo deck mới',
      description:
        'Tạo một deck thuộc sở hữu người dùng hiện tại (ownerType = user, ownerId = người dùng hiện tại). Status luôn là published vì deck chỉ dùng cho cá nhân. Mỗi người dùng được tạo tối đa 3 bộ thẻ; vượt quá sẽ trả về lỗi 400.',
      requestBody: jsonBody('UserDeckCreateRequest'),
      responses: {
        201: jsonResponse('UserDeckCreateResponse', 'Deck created successfully.'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/decks/{deckId}': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy chi tiết deck của người dùng',
      description: 'Trả về chi tiết một deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam],
      responses: {
        200: jsonResponse(
          'UserDeckDetailResponse',
          'Deck detail retrieved successfully.'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Cập nhật deck',
      description:
        'Cập nhật thông tin một deck do người dùng hiện tại sở hữu. Chỉ chủ sở hữu mới được cập nhật.',
      parameters: [deckIdParam],
      requestBody: jsonBody('UserDeckUpdateRequest'),
      responses: {
        200: jsonResponse(
          'UserDeckUpdateResponse',
          'Deck updated successfully.'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Xóa deck',
      description:
        'Xóa một deck do người dùng hiện tại sở hữu cùng toàn bộ topic và card bên trong. Chỉ chủ sở hữu mới được xóa.',
      parameters: [deckIdParam],
      responses: {
        200: simpleSuccess('DECK_DELETE_SUCCESS', 'Deck deleted successfully'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== TOPIC ====================
  '/users/me/decks/{deckId}/topics': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy danh sách topic trong deck của người dùng',
      description:
        'Trả về danh sách topic thuộc một deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam],
      responses: {
        200: jsonResponse(
          'UserTopicListResponse',
          'Topics retrieved successfully.'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Tạo topic mới trong deck',
      description:
        'Tạo một topic mới bên trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam],
      requestBody: jsonBody('UserTopicCreateRequest'),
      responses: {
        201: jsonResponseWithCode(
          'UserTopicMutationResponse',
          'Topic created successfully',
          'TOPIC_CREATE_SUCCESS',
          'Topic created successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/decks/{deckId}/topics/{topicId}': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy chi tiết topic',
      description:
        'Trả về chi tiết một topic trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam, topicIdParam],
      responses: {
        200: jsonResponseWithCode(
          'UserTopicMutationResponse',
          'Topic detail retrieved successfully',
          'TOPIC_DETAIL_SUCCESS',
          'Topic detail retrieved successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or topic not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Cập nhật topic',
      description:
        'Cập nhật một topic trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam, topicIdParam],
      requestBody: jsonBody('UserTopicUpdateRequest'),
      responses: {
        200: jsonResponseWithCode(
          'UserTopicMutationResponse',
          'Topic updated successfully',
          'TOPIC_UPDATE_SUCCESS',
          'Topic updated successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or topic not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Xóa topic',
      description:
        'Xóa một topic trong deck do người dùng hiện tại sở hữu cùng toàn bộ card bên trong.',
      parameters: [deckIdParam, topicIdParam],
      responses: {
        200: simpleSuccess(
          'TOPIC_DELETE_SUCCESS',
          'Topic deleted successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or topic not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/decks/{deckId}/topics/{topicId}/export': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Export cards của topic',
      description:
        'Xuất danh sách card trong topic ra file Excel. Yêu cầu đăng nhập bằng Bearer token và phải là chủ sở hữu deck.',
      parameters: [deckIdParam, topicIdParam],
      responses: {
        200: {
          description: 'Xuất file thành công. Trả về file .xlsx',
        },
        400: {
          description: 'Lỗi xác thực (Topic does not belong to this deck)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'TOPIC_NOT_BELONG_TO_DECK',
                message: 'Topic is not belong to the selected deck',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: {
          description: 'Không có quyền export',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'EXPORT_PERMISSION_DENIED',
                message: "You don't have permission to export this deck",
              },
            },
          },
        },
        404: {
          description: 'Deck, topic or user not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                DeckNotFound: {
                  value: {
                    success: false,
                    code: 'DECK_NOT_FOUND',
                    message: 'Deck not found',
                  },
                },
                TopicNotFound: {
                  value: {
                    success: false,
                    code: 'TOPIC_NOT_FOUND',
                    message: 'Topic not found',
                  },
                },
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/decks/{deckId}/topics/{topicId}/import': {
    post: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Import cards vào topic',
      description:
        'Nhập danh sách card từ file Excel vào topic. Yêu cầu đăng nhập bằng Bearer token và phải là chủ sở hữu deck.\n\n**Định dạng file Excel (header dòng 1):** `term` `translation` `explanation_vi` `examples_en` `pos`\n- Các cột bắt buộc phải có: term và translation',
      parameters: [deckIdParam, topicIdParam],
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
                  description: 'URL của file Excel đã được upload',
                  example: 'https://s3.amazonaws.com/.../cards.xlsx',
                },
                mode: {
                  type: 'string',
                  enum: ['append', 'replace', 'upsert'],
                  description:
                    'Chế độ import: append (thêm mới), replace (thay thế toàn bộ), upsert (cập nhật nếu đã tồn tại)',
                  example: 'append',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Import cards thành công.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
              example: {
                success: true,
                code: 'CARD_IMPORT_SUCCESS',
                message: 'Cards imported successfully',
                data: {
                  summary: {
                    totalRows: 3,
                    inserted: 1,
                    updated: 2,
                    skipped: 0,
                    failed: 0,
                    mode: 'upsert',
                    requiredColumns: ['term', 'translation'],
                    errors: [],
                  },
                  cardsProcessed: 3,
                },
              },
            },
          },
        },
        400: {
          description: 'Dữ liệu đầu vào không hợp lệ',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                fileRequired: {
                  value: {
                    success: false,
                    code: 'FILE_URL_REQUIRED',
                    message: 'File URL is required',
                  },
                },
                modeInvalid: {
                  value: {
                    success: false,
                    code: 'MODE_INVALID',
                    message: 'mode must be one of: append, replace, upsert',
                  },
                },
                topicNotBelong: {
                  value: {
                    success: false,
                    code: 'TOPIC_NOT_BELONG_TO_DECK',
                    message: 'Topic is not belong to the selected deck',
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: {
          description: 'Không có quyền import',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'IMPORT_PERMISSION_DENIED',
                message:
                  "You don't have permission to import into this deck. Only the owner can import",
              },
            },
          },
        },
        404: {
          description: 'Deck or topic not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                DeckNotFound: {
                  value: {
                    success: false,
                    code: 'DECK_NOT_FOUND',
                    message: 'Deck not found',
                  },
                },
                TopicNotFound: {
                  value: {
                    success: false,
                    code: 'TOPIC_NOT_FOUND',
                    message: 'Topic not found',
                  },
                },
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== CARD ====================
  '/users/me/decks/{deckId}/cards': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy danh sách card trong deck của người dùng',
      description:
        'Trả về danh sách card thuộc một deck do người dùng hiện tại sở hữu. Có thể lọc theo topicId.',
      parameters: [
        deckIdParam,
        {
          name: 'topicId',
          in: 'query',
          required: false,
          description: 'Lọc card theo ObjectId của topic.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439041',
          },
        },
        qParam,
        pageParam,
        limitParam,
      ],
      responses: {
        200: jsonResponse(
          'UserCardListResponse',
          'Lấy danh sách card thành công.'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    post: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Tạo card mới trong deck',
      description:
        'Tạo một card mới bên trong deck do người dùng hiện tại sở hữu. Cần chỉ định topicId thuộc deck này.',
      parameters: [deckIdParam],
      requestBody: jsonBody('UserCardCreateRequest'),
      responses: {
        201: jsonResponseWithCode(
          'UserCardMutationResponse',
          'Card created successfully',
          'CARD_CREATE_SUCCESS',
          'Card created successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or topic not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/decks/{deckId}/cards/{cardId}': {
    get: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Lấy chi tiết card',
      description:
        'Trả về chi tiết một card trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam, cardIdParam],
      responses: {
        200: jsonResponseWithCode(
          'UserCardMutationResponse',
          'Card detail retrieved successfully',
          'CARD_DETAIL_SUCCESS',
          'Card detail retrieved successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or card not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    put: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Cập nhật card',
      description:
        'Cập nhật một card trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam, cardIdParam],
      requestBody: jsonBody('UserCardUpdateRequest'),
      responses: {
        200: jsonResponseWithCode(
          'UserCardMutationResponse',
          'Card updated successfully',
          'CARD_UPDATE_SUCCESS',
          'Card updated successfully'
        ),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or card not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    delete: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Xóa card',
      description: 'Xóa một card trong deck do người dùng hiện tại sở hữu.',
      parameters: [deckIdParam, cardIdParam],
      responses: {
        200: simpleSuccess('CARD_DELETE_SUCCESS', 'Card deleted successfully'),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: NotFound('Deck or card not found'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
