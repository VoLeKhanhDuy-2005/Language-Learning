import { publicAccess, cookieAuth } from '../helpers/security.js';

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

const simpleSuccess = (code, message) => ({
  description: message,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/SuccessResponse' },
      example: { success: true, code, message },
    },
  },
});

const validationError = (fieldExample, messageExample) => ({
  description: 'Invalid request data.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: {
        success: false,
        code: 'INVALID_DATA',
        message: 'Invalid request data',
        errors: [{ field: fieldExample, message: messageExample }],
      },
    },
  },
});

const TAG = 'Auth';

export default {
  // ==================== SIGNUP ====================
  '/auth/signup': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Đăng ký tài khoản mới',
      description:
        'Tạo tài khoản mới. Tài khoản được tạo với isVerified = false; mã OTP kích hoạt tự động gửi về email.',
      requestBody: jsonBody('SignupPayload'),
      responses: {
        201: simpleSuccess(
          'SIGNUP_SUCCESS',
          'Account created successfully. An activation OTP has been sent to your email.'
        ),
        400: validationError('email', 'Email is already registered'),
        429: {
          description: 'Too many signup attempts.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'TOO_MANY_REQUESTS',
                message: 'Too many signup attempts. Please try again later.',
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== LOGIN ====================
  '/auth/login': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Đăng nhập',
      description:
        'Xác thực email + password. Trả về accessToken trong body; đặt refreshToken vào httpOnly cookie (SameSite=strict, maxAge 7 ngày).',
      requestBody: jsonBody('LoginPayload'),
      responses: {
        200: jsonResponse('LoginResponse', 'Login successful.'),
        400: {
          description: 'Wrong email/password or account not activated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
              },
            },
          },
        },
        429: {
          description: 'Too many failed login attempts.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'TOO_MANY_REQUESTS',
                message:
                  'Too many failed login attempts. Please try again in 15 minutes.',
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== REFRESH ====================
  '/auth/refresh': {
    post: {
      ...cookieAuth,
      tags: [TAG],
      summary: 'Làm mới access token',
      description:
        'Dùng refreshToken trong httpOnly cookie để cấp accessToken mới. Cookie phải được gửi kèm request (credentials: include).',
      responses: {
        200: jsonResponse('RefreshResponse', 'Token refreshed successfully.'),
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== LOGOUT ====================
  '/auth/logout': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Đăng xuất',
      description:
        'Xóa refreshToken cookie. Client tự xóa accessToken ở localStorage. Không yêu cầu Bearer token.',
      responses: {
        200: simpleSuccess('LOGOUT_SUCCESS', 'Logged out successfully'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== VERIFY EMAIL ====================
  '/auth/verify-email/send': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Gửi lại OTP kích hoạt tài khoản',
      description:
        'Gửi lại mã OTP 6 chữ số về email để kích hoạt tài khoản. OTP được lưu Redis và hết hạn theo cấu hình.',
      requestBody: jsonBody('ResendVerifyEmailPayload'),
      responses: {
        200: simpleSuccess(
          'VERIFICATION_EMAIL_SENT',
          'Account activation OTP has been sent'
        ),
        400: validationError(
          'email',
          'Invalid email or account already activated'
        ),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/auth/verify-email': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Xác thực OTP kích hoạt tài khoản',
      description:
        'Nhập email + OTP để kích hoạt tài khoản (isVerified = true). OTP lấy từ email sau khi gọi /auth/verify-email/send.',
      requestBody: jsonBody('VerifyEmailPayload'),
      responses: {
        200: simpleSuccess('EMAIL_VERIFIED', 'Account activated successfully'),
        400: {
          description: 'OTP is invalid or has expired.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'INVALID_OTP',
                message: 'OTP is invalid or has expired',
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },

  // ==================== FORGOT / RESET PASSWORD ====================
  '/auth/forgot-password': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Yêu cầu OTP đặt lại mật khẩu',
      description:
        'Gửi mã OTP 6 chữ số về email để xác thực trước khi đặt lại mật khẩu.',
      requestBody: jsonBody('ForgotPasswordPayload'),
      responses: {
        200: simpleSuccess(
          'PASSWORD_RESET_OTP_SENT',
          'Password reset OTP has been sent'
        ),
        400: validationError('email', 'No account found with this email'),
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
  '/auth/reset-password': {
    post: {
      ...publicAccess,
      tags: [TAG],
      summary: 'Đặt lại mật khẩu',
      description:
        'Xác thực OTP và đặt mật khẩu mới. OTP phải lấy từ /auth/forgot-password trước.',
      requestBody: jsonBody('ResetPasswordPayload'),
      responses: {
        200: simpleSuccess(
          'PASSWORD_RESET_SUCCESS',
          'Password reset successfully'
        ),
        400: {
          description: 'OTP is invalid, expired, or the password is too short.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                code: 'INVALID_OTP',
                message: 'OTP is invalid or has expired',
              },
            },
          },
        },
        500: { $ref: '#/components/responses/ServerError' },
      },
    },
  },
};
