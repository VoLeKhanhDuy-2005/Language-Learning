import bcrypt from 'bcrypt';
import User from '../../models/user.model.js';
import { generateToken, verifyToken } from '../../utils/jwt.js';
import { config } from '../../config/env.js';
import redisClient from '../../config/redis.js';
import AppError from '../../utils/AppError.js';
import { AUTH, COMMON } from '../../constants/codes/index.js';
import {
  sendOtpEmail,
  sendForgotPasswordEmail,
} from '../../utils/mail.util.js';

// Helper sinh mã OTP 6 chữ số
const generateOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const signup = async (email, password, name) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(AUTH.EMAIL_EXISTS, 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    passwordHash,
    name,
    role: 'user',
    isVerified: false,
    isActive: true,
  });

  const otp = generateOtpCode();
  const redisKey = `otp:verify_email:${email}`;
  await redisClient.set(redisKey, otp, { EX: config.otpTTL });

  sendOtpEmail(email, otp).catch((error) => {
    console.error('Lỗi gửi email kích hoạt ngầm:', error);
  });

  return {
    id: user._id,
    email: user.email,
    name: user.name,
  };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(AUTH.INVALID_CREDENTIALS, 400);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(AUTH.INVALID_CREDENTIALS, 400);
  }

  if (!user.isVerified) {
    throw new AppError(AUTH.ACCOUNT_NOT_VERIFIED, 403);
  }

  if (!user.isActive) {
    throw new AppError(
      AUTH.ACCOUNT_BANNED,
      403,
      [],
      user.banReason ? `Account has been locked: ${user.banReason}` : undefined
    );
  }

  const accessToken = generateToken(
    { id: user._id, role: user.role, type: 'ACCESS' },
    config.jwtAccessExpiresIn
  );

  const refreshToken = generateToken(
    { id: user._id, role: user.role, type: 'REFRESH' },
    config.jwtRefreshExpiresIn
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
};

export const sendVerificationEmail = async (email) => {
  if (!redisClient.isOpen) {
    throw new AppError(COMMON.SERVICE_UNAVAILABLE, 500);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(AUTH.ACCOUNT_NOT_FOUND, 404);
  }
  if (user.isVerified) {
    throw new AppError(AUTH.ACCOUNT_ALREADY_VERIFIED, 400);
  }

  const otp = generateOtpCode();
  const redisKey = `otp:verify_email:${email}`;
  await redisClient.set(redisKey, otp, { EX: config.otpTTL });

  sendOtpEmail(email, otp).catch((error) => {
    console.error('Lỗi gửi email:', error);
  });
};

export const verifyEmail = async (email, otp) => {
  if (!redisClient.isOpen) {
    throw new AppError(COMMON.SERVICE_UNAVAILABLE, 500);
  }

  const redisKey = `otp:verify_email:${email}`;
  const cachedOtp = await redisClient.get(redisKey);

  if (!cachedOtp || cachedOtp !== otp) {
    throw new AppError(AUTH.INVALID_OTP, 400);
  }

  // Xác thực đúng, cập nhật DB và xóa OTP
  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );
  if (!user) {
    throw new AppError(AUTH.ACCOUNT_NOT_FOUND, 404);
  }

  await redisClient.del(redisKey);
};

export const forgotPassword = async (email) => {
  if (!redisClient.isOpen) {
    throw new AppError(COMMON.SERVICE_UNAVAILABLE, 500);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(AUTH.ACCOUNT_NOT_FOUND, 404);
  }
  if (!user.isActive) {
    throw new AppError(AUTH.ACCOUNT_BANNED, 403);
  }

  const otp = generateOtpCode();
  const redisKey = `otp:forgot_password:${email}`;
  await redisClient.set(redisKey, otp, { EX: config.otpTTL });

  sendForgotPasswordEmail(email, otp).catch((error) => {
    console.error('Lỗi gửi email đặt lại mật khẩu:', error);
  });
};

export const resetPassword = async (email, otp, newPassword) => {
  if (!redisClient.isOpen) {
    throw new AppError(COMMON.SERVICE_UNAVAILABLE, 500);
  }

  const redisKey = `otp:forgot_password:${email}`;
  const cachedOtp = await redisClient.get(redisKey);

  if (!cachedOtp || cachedOtp !== otp) {
    throw new AppError(AUTH.INVALID_OTP, 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const user = await User.findOneAndUpdate(
    { email },
    { passwordHash, passwordChangedAt: new Date() },
    { new: true }
  );
  if (!user) {
    throw new AppError(AUTH.USER_NOT_FOUND, 404);
  }

  await redisClient.del(redisKey);
  if (redisClient.isOpen) {
    await redisClient.del(`user:auth:${user._id}`);
  }
};

export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(AUTH.REFRESH_TOKEN_REQUIRED, 401);
  }

  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (error) {
    throw new AppError(AUTH.REFRESH_TOKEN_INVALID, 401);
  }

  if (decoded.type !== 'REFRESH') {
    throw new AppError(AUTH.INVALID_TOKEN, 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(AUTH.USER_NO_LONGER_EXISTS, 401);
  }

  if (!user.isActive) {
    throw new AppError(
      AUTH.ACCOUNT_BANNED,
      403,
      [],
      user.banReason ? `Account has been locked: ${user.banReason}` : undefined
    );
  }

  if (
    user.passwordChangedAt &&
    decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    //decoded.iat: iat là viết tắt của Issued At trong JWT -> thời điểm JWT token được tạo
    // -> tạo trước khi đổi mật khẩu
  ) {
    throw new AppError(AUTH.INVALID_TOKEN, 401);
  }

  const accessToken = generateToken(
    { id: user._id, role: user.role, type: 'ACCESS' },
    config.jwtAccessExpiresIn
  );

  const newRefreshToken = generateToken(
    { id: user._id, role: user.role, type: 'REFRESH' },
    config.jwtRefreshExpiresIn
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};
