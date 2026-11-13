import { Request, Response } from 'express';
import * as referralService from './referral.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';

/**
 * GET /api/v1/referral
 * Full referral info + stats for current user
 */
export const getInfo = asyncHandler(async (req: Request, res: Response) => {
  const stats = await referralService.getReferralInfo(req.user!.userId);
  return successResponse(res, { data: stats });
});

// Keep backward-compatible alias
export const getStats = getInfo;

/**
 * GET /api/v1/referral/network?level=1&page=1&limit=20
 * Get referred members at a specific level with details
 */
export const getNetwork = asyncHandler(async (req: Request, res: Response) => {
  const level = (Number(req.query.level) || 1) as 1 | 2 | 3;
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;

  if (![1, 2, 3].includes(level)) throw new AppError('Level phải là 1, 2 hoặc 3.', 400);

  const result = await referralService.getReferralNetwork(req.user!.userId, level, page, limit);
  return successResponse(res, { data: result });
});

/**
 * GET /api/v1/referral/commissions?level=F1&status=PAID&page=1
 * Commission transaction history
 */
export const getCommissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await referralService.getCommissionHistory(req.user!.userId, {
    level:  req.query.level  as string,
    status: req.query.status as string,
    page:   Number(req.query.page)  || 1,
    limit:  Number(req.query.limit) || 20,
  });
  return successResponse(res, { data: result });
});
