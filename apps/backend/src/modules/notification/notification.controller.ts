import { Request, Response } from 'express';
import prisma from '../../core/database';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { getPagination } from '../../shared/utils/helpers';
import { AppError } from '../../shared/utils/AppError';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
  ]);

  return successResponse(res, {
    data: { notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });

  return successResponse(res, { data: { count } });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!notification) throw new AppError('Thông báo không tồn tại.', 404);

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true, readAt: new Date() },
  });

  return successResponse(res, { message: 'Đã đánh dấu đã đọc.' });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return successResponse(res, { message: 'Đã đánh dấu tất cả đã đọc.' });
});
