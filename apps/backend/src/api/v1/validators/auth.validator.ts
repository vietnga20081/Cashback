import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Phải có ít nhất 1 số'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(150),
    referralCode: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
    rememberMe: z.boolean().optional(),
  }),
});

export const otpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'OTP phải có 6 chữ số'),
    type: z.enum(['VERIFY', 'RESET', 'LOGIN']),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Phải có ít nhất 1 số'),
  }),
});
