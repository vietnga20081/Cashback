import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../core/database';
import { cache } from '../../core/redis';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import { sanitizeUser, getPagination } from '../../shared/utils/helpers';
import { env } from '../../core/config/env';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { wallet: true, telegramAccount: true, zaloAccount: true },
  });

  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  return successResponse(res, { data: sanitizeUser(user) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, phone, gender, dateOfBirth } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { fullName, phone, gender, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.userId,
      action: 'UPDATE_PROFILE',
      description: 'Cập nhật thông tin cá nhân',
      ipAddress: req.ip,
    },
  });

  return successResponse(res, { message: 'Cập nhật thành công.', data: sanitizeUser(user) });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Vui lòng chọn ảnh.', 400);

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { avatar: avatarUrl },
  });

  return successResponse(res, { message: 'Cập nhật ảnh đại diện thành công.', data: { avatar: avatarUrl } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new AppError('Mật khẩu hiện tại không đúng.', 400);

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  // Revoke all refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { isRevoked: true },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'CHANGE_PASSWORD', ipAddress: req.ip },
  });

  return successResponse(res, { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
});

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { userId: req.user!.userId } }),
  ]);

  return successResponse(res, {
    data: { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

// ─── Saved Products ───────────────────────────────────────────────────────────

export const getSavedProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);

  const [products, total] = await Promise.all([
    prisma.savedProduct.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.savedProduct.count({ where: { userId: req.user!.userId } }),
  ]);

  return successResponse(res, {
    data: { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const saveProduct = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, productUrl, productId, name, image, price, cashback, category, note } = req.body;

  const product = await prisma.savedProduct.create({
    data: {
      userId: req.user!.userId,
      merchantId,
      productUrl,
      productId,
      name,
      image,
      price,
      cashback,
      category,
      note,
    },
  });

  return successResponse(res, { message: 'Đã lưu sản phẩm.', data: product }, 201);
});

export const deleteSavedProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.savedProduct.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!product) throw new AppError('Sản phẩm không tồn tại.', 404);

  await prisma.savedProduct.delete({ where: { id: product.id } });

  return successResponse(res, { message: 'Đã xóa sản phẩm.' });
});

// ─── Telegram Linking ─────────────────────────────────────────────────────────

export const generateTelegramLinkToken = asyncHandler(async (req: Request, res: Response) => {
  const token = uuidv4();
  await cache.set(`telegram:link:${token}`, req.user!.userId, 10 * 60); // 10 min expiry

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'GreenCashBot';
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return successResponse(res, { data: { deepLink, token } });
});

export const linkTelegram = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = await cache.get<string>(`telegram:link:${code}`);

  if (!userId || userId !== req.user!.userId) {
    throw new AppError('Mã liên kết không hợp lệ hoặc đã hết hạn.', 400);
  }

  return successResponse(res, { message: 'Vui lòng hoàn tất liên kết qua Telegram bot.' });
});
