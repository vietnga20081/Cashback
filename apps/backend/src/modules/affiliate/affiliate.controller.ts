import { Request, Response } from 'express';
import * as affiliateService from './affiliate.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import prisma from '../../core/database';

export const createLink = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) throw new AppError('Vui lòng nhập URL sản phẩm.', 400);

  const result = await affiliateService.createAffiliateLink(req.user!.userId, url);

  await prisma.activityLog.create({
    data: {
      userId: req.user!.userId,
      action: 'CREATE_AFFILIATE_LINK',
      description: `Tạo link cashback cho ${result.merchantName}`,
      ipAddress: req.ip,
    },
  });

  return successResponse(res, { message: 'Tạo link thành công.', data: result }, 201);
});

export const getLinks = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, page, limit } = req.query;

  const result = await affiliateService.getUserAffiliateLinks(req.user!.userId, {
    merchantId: merchantId ? Number(merchantId) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return successResponse(res, { data: result });
});

export const deleteLink = asyncHandler(async (req: Request, res: Response) => {
  const link = await prisma.affiliateLink.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!link) throw new AppError('Link không tồn tại.', 404);

  await prisma.affiliateLink.update({ where: { id: link.id }, data: { isActive: false } });

  return successResponse(res, { message: 'Đã xóa link.' });
});
