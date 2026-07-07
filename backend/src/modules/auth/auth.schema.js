import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email là bắt buộc' }),
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }),
});

export const signupSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Email không đúng định dạng' }),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
  name: z
    .string({ required_error: 'Tên là bắt buộc' })
    .min(2, { message: 'Tên phải chứa ít nhất 2 ký tự' }),
});

export const resendVerifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Email không đúng định dạng' }),
});

export const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Email không đúng định dạng' }),
  otp: z
    .string({ required_error: 'Mã OTP là bắt buộc' })
    .length(6, { message: 'Mã OTP phải có đúng 6 chữ số' })
    .regex(/^\d+$/, { message: 'Mã OTP chỉ chứa ký tự số' }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Email không đúng định dạng' }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Email không đúng định dạng' }),
  otp: z
    .string({ required_error: 'Mã OTP là bắt buộc' })
    .length(6, { message: 'Mã OTP phải có đúng 6 chữ số' })
    .regex(/^\d+$/, { message: 'Mã OTP chỉ chứa ký tự số' }),
  newPassword: z
    .string({ required_error: 'Mật khẩu mới là bắt buộc' })
    .min(6, { message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' }),
});
