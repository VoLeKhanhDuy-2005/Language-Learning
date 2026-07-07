import { USER, MESSAGES } from '../../../constants/codes/index.js';

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

const SegmentNotFound = {
  description: 'Không tìm thấy segment',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        message: 'Không tìm thấy segment',
      },
    },
  },
};

const ProgressBadRequest = {
  description: 'Invalid request data',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        InvalidDictationAttemptCount: {
          summary: 'Invalid dictation attemptCount',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'body.dictation.attemptCount',
                message: 'Number must be greater than or equal to 1',
              },
            ],
          },
        },
        InvalidDictationHintUsedCount: {
          summary: 'Invalid dictation hintUsedCount',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'body.dictation.hintUsedCount',
                message: 'Number must be greater than or equal to 0',
              },
            ],
          },
        },
        InvalidShadowingAttemptCount: {
          summary: 'Invalid shadowing attemptCount',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'body.shadowing.attemptCount',
                message: 'Number must be greater than or equal to 1',
              },
            ],
          },
        },
        InvalidShadowingLatestAudioUrl: {
          summary: 'Invalid shadowing latestAudioUrl',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'body.shadowing.latestAudioUrl',
                message: 'String must contain at least 1 character(s)',
              },
            ],
          },
        },
        MissingDictationOrShadowing: {
          summary: 'Missing both dictation and shadowing',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'body.',
                message: 'There should be at least dictation or shadowing.',
              },
            ],
          },
        },
      },
    },
  },
};

const CardStateNotFound = {
  description: 'User card state not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'CARD_STATE_NOT_FOUND',
        message: 'User card state not found',
      },
    },
  },
};

const CardStatePatchBadRequest = {
  description: 'Dữ liệu đầu vào không hợp lệ hoặc thiếu dữ liệu khi tạo mới',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        MissingFields: {
          summary: 'Missing deckId and topicId when creation.',
          value: {
            success: false,
            code: 'CARD_STATE_CREATE_MISSING_DATA',
            message:
              'deckId and topicId are required when creating a new card state',
            errors: [],
          },
        },
      },
    },
  },
};

const ProfileUpdateBadRequest = {
  description: 'Invalid input data (validation error or format error)',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: {
        IncorrectOldPassword: {
          summary: 'Old password is incorrect',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              { field: 'oldPassword', message: 'Old password is incorrect' },
            ],
          },
        },
        InvalidName: {
          summary: 'Invalid display name',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'name',
                message: 'Display name must not contain special characters',
              },
            ],
          },
        },
        MissingPassword: {
          summary: 'Missing current or new password',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'oldPassword',
                message: 'Please enter current password',
              },
              { field: 'newPassword', message: 'Please enter new password' },
            ],
          },
        },
        PasswordMismatch: {
          summary: 'Password confirmation does not match',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'confirmPassword',
                message: 'Password confirmation does not match.',
              },
            ],
          },
        },
        EmptyName: {
          summary: 'Display name cannot be empty',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'name',
                message: 'Display name cannot be empty',
              },
            ],
          },
        },
        NameTooLong: {
          summary: 'Display name must be at most 50 characters',
          value: {
            success: false,
            code: 'INVALID_DATA',
            message: 'Invalid request data',
            errors: [
              {
                field: 'name',
                message: 'Display name must be at most 50 characters',
              },
            ],
          },
        },
        PasswordTooShort: {
          summary: 'Password must be at least 6 characters',
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

export default {
  '/users/me/lessons/{lessonId}/segments-progress': {
    get: {
      tags: ['User Segment Progress'],
      summary: 'Lấy danh sách segment progress của một lesson',
      description:
        'Lấy danh sách segment progress của một lesson của người dùng hiện tại.',
      security: [
        {
          BearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'path',
          name: 'lessonId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID của bài học',
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved lesson segments progress',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SegmentProgressResponse',
              },
            },
          },
        },
        404: LessonNotFound,
        401: {
          $ref: '#/components/responses/Unauthorized',
        },
        500: {
          $ref: '#/components/responses/ServerError',
        },
      },
    },
  },
  '/users/me/lessons/{lessonId}/segments/{segmentId}/progress': {
    get: {
      tags: ['User Segment Progress'],
      summary: 'Lấy chi tiết segment progress trong một lesson',
      description:
        'Lấy thông tin segment progress (dictation, shadowing) của trong một lesson cụ thể.',
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
          description: 'Successfully retrieved segment progress details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SegmentProgressSingleResponse',
              },
            },
          },
        },
        404: {
          description: 'Segment not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'SEGMENT_PROGRESS_NOT_FOUND',
                message: 'Segment progress not found',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },

    patch: {
      tags: ['User Segment Progress'],
      summary: 'Upsert/Cập nhật một phần segment progress',
      description:
        'Upsert hoặc cập nhật một phần block dictation hoặc shadowing của segment progress trong một lesson. Nếu chưa có tiến độ sẽ tự động tạo mới.',
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
            schema: {
              $ref: '#/components/schemas/SegmentProgressPayload',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully updated segment progress',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/SegmentProgressSingleResponse',
                  },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'SEGMENT_PROGRESS_UPDATE_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Successfully updated segment progress',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: ProgressBadRequest,
        404: {
          description: 'Segment not found in this lesson',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'SEGMENT_NOT_FOUND_IN_LESSON',
                message: 'Segment not found in this lesson',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/card-states': {
    get: {
      tags: ['User Card States'],
      summary: 'Lấy danh sách user card states',
      description:
        'Lấy danh sách các user card states (trạng thái học thẻ từ) của người dùng đang đăng nhập. Hỗ trợ lọc theo deckId, topicId, due, starred, hidden, phân trang.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'deckId',
          schema: { type: 'string' },
          description: 'Lọc theo deckId',
        },
        {
          in: 'query',
          name: 'topicId',
          schema: { type: 'string' },
          description: 'Lọc theo topicId',
        },
        {
          in: 'query',
          name: 'due',
          schema: { type: 'boolean' },
          description:
            'Chỉ lấy các thẻ đã đến hạn ôn tập (nextReviewAt <= now)',
        },
        {
          in: 'query',
          name: 'starred',
          schema: { type: 'boolean' },
          description:
            'Chỉ lấy các thẻ được đánh dấu sao (có cờ "starred" = true)',
        },
        {
          in: 'query',
          name: 'hidden',
          schema: { type: 'boolean' },
          description:
            'Lọc theo trạng thái bị ẩn của thẻ (có cờ "hidden" = true/false)',
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
          schema: { type: 'integer', default: 20 },
          description: 'Số lượng kết quả trên mỗi trang',
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved user card states',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CardStatesResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/card-states/{cardId}': {
    get: {
      tags: ['User Card States'],
      summary: 'Lấy state của một user card',
      description:
        'Lấy thông tin state (SRS, cờ) của một card cụ thể của người dùng đang đăng nhập.',
      security: [{ BearerAuth: [] }],
      parameters: [
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
          description: 'Successfully retrieved user card state details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CardStateResponse' },
            },
          },
        },
        404: CardStateNotFound,
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
    patch: {
      tags: ['User Card States'],
      summary: 'Upsert / Cập nhật state của một card',
      description:
        'Cập nhật một phần state của một card. Nếu card chưa có state, sẽ tự động tạo mới (bắt buộc phải có deckId và topicId trong body khi tạo mới).',
      security: [{ BearerAuth: [] }],
      parameters: [
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
            schema: { $ref: '#/components/schemas/CardStatePatchPayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully created/updated card state',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/CardStateResponse' },
                  {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        example: 'CARD_STATE_UPSERT_SUCCESS',
                      },
                      message: {
                        type: 'string',
                        example: 'Successfully created/updated card state',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: CardStatePatchBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/profile-update': {
    patch: {
      tags: ['User Profile'],
      summary: 'Update user profile',
      description:
        'Allows the user to update their display name, password, and avatar.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfilePayload' },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileResponse' },
            },
          },
        },
        400: ProfileUpdateBadRequest,
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/users/me/stats': {
    get: {
      tags: ['User Profile'],
      summary: 'Lấy số liệu thống kê của user',
      description:
        'Lấy tổng số lesson đã học và tổng số card đã review của user hiện tại để hiển thị trên profile.',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Get current user stats successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  code: { type: 'string', example: USER.STATS_GET_SUCCESS },
                  message: {
                    type: 'string',
                    example: MESSAGES[USER.STATS_GET_SUCCESS],
                  },
                  data: {
                    type: 'object',
                    properties: {
                      learnedLessons: { type: 'integer', example: 10 },
                      reviewedCards: { type: 'integer', example: 150 },
                    },
                  },
                },
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
