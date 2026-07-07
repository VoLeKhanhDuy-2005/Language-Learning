const optionalBearerSecurity = [{}, { BearerAuth: [] }];
const bearerSecurity = [{ BearerAuth: [] }];

export default {
  '/lessons': {
    get: {
      tags: ['Lesson'],
      summary: 'Lấy danh sách bài học đã công khai',
      description:
        'Trả về danh sách bài học đã công khai. Không bắt buộc đăng nhập; nếu gửi Bearer token hợp lệ thì response có thêm userProgress.',
      security: optionalBearerSecurity,
      parameters: [
        {
          name: 'tagId',
          in: 'query',
          required: false,
          description: 'Lọc danh sách bài học theo ObjectId của tag.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439011',
          },
        },
        {
          name: 'cefrLevelId',
          in: 'query',
          required: false,
          description: 'Lọc danh sách bài học theo ObjectId của cấp độ CEFR.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439012',
          },
        },
        {
          name: 'mode',
          in: 'query',
          required: false,
          description: 'Lọc danh sách bài học theo chế độ học.',
          schema: {
            type: 'string',
            enum: ['dictation', 'shadowing'],
            example: 'dictation',
          },
        },
        {
          name: 'q',
          in: 'query',
          required: false,
          description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mô tả bài học.',
          schema: {
            type: 'string',
            example: 'daily conversation',
          },
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          description: 'Số trang cần lấy.',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Số lượng bài học trên mỗi trang.',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10,
          },
        },
      ],
      responses: {
        200: {
          description: 'Lấy danh sách bài học thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LessonListResponse',
              },
            },
          },
        },
        400: {
          description: 'Tham số truy vấn không hợp lệ.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'INVALID_DATA',
                message: 'Invalid request data',
                errors: [
                  {
                    field: 'page',
                    message: 'page must be an integer >= 1',
                  },
                ],
              },
            },
          },
        },
        500: {
          $ref: '#/components/responses/ServerError',
        },
      },
    },
  },
  '/lessons/{lessonId}': {
    get: {
      tags: ['Lesson'],
      summary: 'Lấy chi tiết một bài học đã công khai',
      description:
        'Trả về thông tin chi tiết của một bài học đã công khai. Yêu cầu đăng nhập.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'lessonId',
          in: 'path',
          required: true,
          description: 'ObjectId của bài học cần lấy chi tiết.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439013',
          },
        },
      ],
      responses: {
        200: {
          description: 'Lấy chi tiết bài học thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LessonDetailResponse',
              },
            },
          },
        },
        400: {
          description: 'lessonId không hợp lệ.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'INVALID_DATA',
                message: 'Invalid request data',
                errors: [
                  {
                    field: 'lessonId',
                    message: 'lessonId is not a valid ObjectId',
                  },
                ],
              },
            },
          },
        },
        404: {
          description: 'Không tìm thấy bài học đã công khai.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'LESSON_NOT_FOUND',
                message: 'Lesson not found',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/Unauthorized',
        },
        500: {
          $ref: '#/components/responses/ServerError',
        },
      },
    },
  },
  '/lessons/{lessonId}/segments': {
    get: {
      tags: ['Lesson'],
      summary: 'Lấy danh sách segment của bài học',
      description:
        'Trả về danh sách segment của một bài học theo thứ tự order tăng dần. Yêu cầu đăng nhập.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'lessonId',
          in: 'path',
          required: true,
          description: 'ObjectId của bài học cần lấy danh sách segment.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439013',
          },
        },
      ],
      responses: {
        200: {
          description: 'Lấy danh sách segment thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LessonSegmentListResponse',
              },
            },
          },
        },
        400: {
          description: 'lessonId không hợp lệ.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'INVALID_DATA',
                message: 'Invalid request data',
                errors: [
                  {
                    field: 'lessonId',
                    message: 'lessonId is not a valid ObjectId',
                  },
                ],
              },
            },
          },
        },
        404: {
          description: 'Không tìm thấy segment của bài học.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'LESSON_NOT_FOUND',
                message: 'Lesson not found',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/Unauthorized',
        },
        500: {
          $ref: '#/components/responses/ServerError',
        },
      },
    },
  },
  '/lessons/{lessonId}/segments/{segmentId}': {
    get: {
      tags: ['Lesson'],
      summary: 'Lấy chi tiết một segment',
      description:
        'Trả về thông tin chi tiết của một segment thuộc bài học công khai. Yêu cầu đăng nhập.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'lessonId',
          in: 'path',
          required: true,
          description: 'ObjectId của bài học chứa segment.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439013',
          },
        },
        {
          name: 'segmentId',
          in: 'path',
          required: true,
          description: 'ObjectId của segment cần lấy chi tiết.',
          schema: {
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            example: '665f1f77bcf86cd799439014',
          },
        },
      ],
      responses: {
        200: {
          description: 'Lấy chi tiết segment thành công.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LessonSegmentDetailResponse',
              },
            },
          },
        },
        400: {
          description: 'lessonId hoặc segmentId không hợp lệ.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'INVALID_DATA',
                message: 'Invalid request data',
                errors: [
                  {
                    field: 'segmentId',
                    message: 'segmentId is not a valid ObjectId',
                  },
                ],
              },
            },
          },
        },
        404: {
          description: 'Không tìm thấy segment thuộc bài học này.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                code: 'SEGMENT_NOT_FOUND',
                message: 'Segment not found',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/Unauthorized',
        },
        500: {
          $ref: '#/components/responses/ServerError',
        },
      },
    },
  },
};
