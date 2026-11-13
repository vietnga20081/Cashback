import { Request, Response } from 'express';
import prisma from '../../core/database';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import { cache, CACHE_KEYS } from '../../core/redis';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get(CACHE_KEYS.MERCHANTS);
  if (cached) return successResponse(res, { data: cached });

  const merchants = await prisma.merchant.findMany({
    where: { isActive: true },
    select: {
      id: true, type: true, name: true, logo: true, description: true,
      userCommission: true, cookieDuration: true,
    },
  });

  await cache.set(CACHE_KEYS.MERCHANTS, merchants, 300);

  return successResponse(res, { data: merchants });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!merchant) throw new AppError('Merchant không tồn tại.', 404);

  return successResponse(res, { data: merchant });
});
