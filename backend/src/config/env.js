import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_key',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  mailHost: process.env.MAIL_HOST || 'smtp.gmail.com',
  mailPort: process.env.MAIL_PORT || 587,
  mailUser: process.env.MAIL_USER || 'your_gmail',
  mailPass: process.env.MAIL_PASS || 'your_password',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  loginLimitWindowMs: parseInt(process.env.LOGIN_LIMIT_WINDOW_MS) || 900000,
  loginLimitMax: parseInt(process.env.LOGIN_LIMIT_MAX) || 5,
  registerLimitWindowMs:
    parseInt(process.env.REGISTER_LIMIT_WINDOW_MS) || 3600000,
  registerLimitMax: parseInt(process.env.REGISTER_LIMIT_MAX) || 3,
  verifyEmailSendLimitWindowMs:
    parseInt(process.env.VERIFY_EMAIL_SEND_LIMIT_WINDOW_MS) || 60000,
  verifyEmailSendLimitMax:
    parseInt(process.env.VERIFY_EMAIL_SEND_LIMIT_MAX) || 5,
  verifyEmailLimitWindowMs:
    parseInt(process.env.VERIFY_EMAIL_LIMIT_WINDOW_MS) || 900000,
  verifyEmailLimitMax:
    parseInt(process.env.VERIFY_EMAIL_LIMIT_MAX) || 10,
  forgotPasswordLimitWindowMs:
    parseInt(process.env.FORGOT_PASSWORD_LIMIT_WINDOW_MS) || 60000,
  forgotPasswordLimitMax:
    parseInt(process.env.FORGOT_PASSWORD_LIMIT_MAX) || 5,
  resetPasswordLimitWindowMs:
    parseInt(process.env.RESET_PASSWORD_LIMIT_WINDOW_MS) || 900000,
  resetPasswordLimitMax:
    parseInt(process.env.RESET_PASSWORD_LIMIT_MAX) || 5,
  otpTTL: parseInt(process.env.OTP_TTL) || 600,
  azureSpeechKey: process.env.AZURE_SPEECH_KEY || '',
  azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'eastus',
};
