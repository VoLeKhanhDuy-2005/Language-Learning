export default {
  openapi: '3.0.0',
  info: {
    title: 'MinLish API',
    version: '1.0.0',
    description:
      'Tài liệu API cho ứng dụng học tiếng Anh MinLish. Hệ thống sử dụng Access Token (Bearer JWT) và Refresh Token (HTTP-only Cookie) cùng cơ chế xác thực email/quên mật khẩu qua OTP Redis.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Server',
    },
  ],
};
