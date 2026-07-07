export default {
  PresignedUrlRequest: {
    type: 'object',
    required: ['contentType', 'purpose', 'fileSize'],
    properties: {
      contentType: {
        type: 'string',
        description: 'MIME type của file sắp upload; phải khớp khi PUT lên S3.',
        example: 'audio/webm',
      },
      purpose: {
        type: 'string',
        enum: ['shadowing-audio', 'deck-import', 'card-image', 'avatar'],
        description:
          'Loại nội dung; quyết định prefix key, whitelist contentType và giới hạn size.',
        example: 'shadowing-audio',
      },
      fileSize: {
        type: 'integer',
        description:
          'Kích thước file (byte). Bắt buộc — được bake vào chữ ký để S3 reject upload sai kích thước.',
        example: 245678,
      },
    },
  },
  PresignedUrlResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      code: { type: 'string', example: 'PRESIGNED_URL_SUCCESS' },
      message: {
        type: 'string',
        example: 'Presigned URL created successfully',
      },
      data: {
        type: 'object',
        properties: {
          uploadUrl: {
            type: 'string',
            description:
              'URL PUT ký sẵn để upload bytes trực tiếp lên S3 (hết hạn 60s).',
            example:
              'https://bucket.s3.region.amazonaws.com/shadowing/<userId>/<rand>.webm?X-Amz-Signature=...',
          },
          key: {
            type: 'string',
            description: 'Key của object trên S3.',
            example: 'shadowing/665f.../a3f9.webm',
          },
          url: {
            type: 'string',
            description:
              'URL public/CDN đầy đủ. Gửi trực tiếp vào body của endpoint cập nhật resource (PUT card, PATCH segment progress…); backend tự validate tại đó.',
            example:
              'https://minlish-english-learning.s3.us-east-1.amazonaws.com/shadowing/665f.../a3f9.webm',
          },
          expiresIn: {
            type: 'integer',
            description: 'Số giây URL còn hiệu lực.',
            example: 60,
          },
        },
      },
    },
  },
};
