import { Request, Response } from 'express';
import * as walletService from './wallet.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getUserWallet(req.user!.userId);
  return successResponse(res, { data: wallet });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
  const stats = await walletService.getWalletStats(req.user!.userId, period);
  return successResponse(res, { data: stats });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, type, status, from, to } = req.query;

  const result = await walletService.getWalletTransactions(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    type: type as string,
    status: status as string,
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
  });

  return successResponse(res, { data: result });
});
