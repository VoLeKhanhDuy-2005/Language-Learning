import { bearerAuth } from '../helpers/security.js';

const TAG = 'File / S3';

export default {
  '/s3/presigned-url': {
    post: {
      ...bearerAuth,
      tags: [TAG],
      summary: 'Tạo presigned URL để upload thẳng lên S3',
      description:
        'Vòng đời upload 2 bước: (1) gọi endpoint này để nhận `uploadUrl` + `url` (public/CDN) — (2) client PUT bytes thẳng lên S3 bằng `uploadUrl`. Sau đó gửi `url` như một trường bình thường trong body của endpoint cập nhật resource (PUT card, PATCH segment progress…); backend tự validate quyền sở hữu + HeadObject tại đó. Key sinh ở server (scope theo userId), contentType bị khóa vào chữ ký. **Lưu ý:** `purpose=card-image` yêu cầu role `admin`; user thường gửi purpose này sẽ nhận 403.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PresignedUrlRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Tạo presigned URL thành công.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PresignedUrlResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
