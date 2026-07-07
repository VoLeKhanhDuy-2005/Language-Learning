import * as authService from './auth.service.js';
import { successResponse } from '../../utils/response.js';
import { AUTH } from '../../constants/codes/index.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.signup(email, password, name);
    res.status(201).json(successResponse(AUTH.SIGNUP_SUCCESS, { user }));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Thiết lập cookie chứa refresh token bảo mật
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    res.status(200).json(
      successResponse(AUTH.LOGIN_SUCCESS, {
        accessToken: result.accessToken,
        user: result.user,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const sendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendVerificationEmail(email);
    res.status(200).json(successResponse(AUTH.VERIFICATION_EMAIL_SENT));
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmail(email, otp);
    res.status(200).json(successResponse(AUTH.EMAIL_VERIFIED));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json(successResponse(AUTH.PASSWORD_RESET_OTP_SENT));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    res.status(200).json(successResponse(AUTH.PASSWORD_RESET_SUCCESS));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await authService.refreshTokens(refreshToken);

    // Cập nhật cookie mới
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      successResponse(AUTH.TOKEN_REFRESHED, {
        accessToken: result.accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Xóa cookie refresh token
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    res.status(200).json(successResponse(AUTH.LOGOUT_SUCCESS));
  } catch (error) {
    next(error);
  }
};
