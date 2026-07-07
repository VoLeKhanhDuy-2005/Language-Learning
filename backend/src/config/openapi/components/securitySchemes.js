export default {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Access Token: Bearer <Token>',
  },
  CookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'refreshToken',
    description: 'Refresh Token stored as an HTTP-only cookie',
  },
};
