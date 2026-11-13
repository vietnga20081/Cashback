import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { successResponse } from '../../shared/utils/asyncHandler';
import { env } from '../../core/config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/v1/auth',
};

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, referralCode } = req.body;
  const user = await authService.registerUser({ email, password, fullName, referralCode });

  return successResponse(res, {
    message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
    data: { userId: user.id, email: user.email },
  }, 201);
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  const result = await authService.loginUser({
    email,
    password,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    rememberMe,
  });

  if ('requires2FA' in result) {
    return successResponse(res, {
      message: 'Vui lòng xác thực 2FA.',
      data: { requires2FA: true, tempToken: result.tempToken },
    });
  }

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return successResponse(res, {
    message: 'Đăng nhập thành công.',
    data: {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        avatar: result.user.avatar,
        roleId: result.user.roleId,
        referralCode: result.user.referralCode,
      },
    },
  });
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) throw { statusCode: 401, message: 'Refresh token không tồn tại.' };

  const result = await authService.rotateRefreshToken(token);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return successResponse(res, {
    data: { accessToken: result.accessToken },
  });
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, type } = req.body;
  await authService.sendEmailOtp(email, type);

  return successResponse(res, { message: 'OTP đã được gửi đến email của bạn.' });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, type } = req.body;
  await authService.verifyEmailOtp(email, otp, type);

  return successResponse(res, { message: 'Xác thực OTP thành công.' });
});

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const { tempToken, token } = req.body;

  // Decode tempToken to get userId
  const { verifyAccessToken } = await import('./auth.service');
  let decoded: any;
  try {
    decoded = verifyAccessToken(tempToken);
  } catch {
    throw { statusCode: 401, message: 'Token không hợp lệ.' };
  }

  await authService.verify2FA(decoded.userId, token);

  // Create full session
  const user = await (await import('../../core/database')).default.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) throw { statusCode: 404, message: 'Không tìm thấy người dùng.' };

  const result = await authService.createUserSession(user, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return successResponse(res, {
    message: 'Xác thực 2FA thành công.',
    data: { accessToken: result.accessToken },
  });
});

export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await authService.generate2FASecret(userId);

  return successResponse(res, { data: result });
});

export const enable2FA = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await authService.enable2FA(userId, req.body.token);

  return successResponse(res, { message: '2FA đã được kích hoạt.' });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const prisma = (await import('../../core/database')).default;
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  return successResponse(res, { message: 'Đăng xuất thành công.' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const prisma = (await import('../../core/database')).default;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (user) {
    await authService.sendEmailOtp(email, 'RESET');
  }

  return successResponse(res, {
    message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  await authService.verifyEmailOtp(email, otp, 'RESET');

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const prisma = (await import('../../core/database')).default;
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return successResponse(res, { message: 'Mật khẩu đã được đặt lại thành công.' });
});
