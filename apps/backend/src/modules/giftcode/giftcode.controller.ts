import { Request, Response } from 'express';
import * as giftcodeService from './giftcode.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';

export const redeem = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) throw new AppError('Vui lòng nhập mã giftcode.', 400);

  const result = await giftcodeService.redeemGiftcode(req.user!.userId, code);

  return successResponse(res, {
    message: `Nhập mã thành công! Bạn nhận được ${result.benefit.toLocaleString('vi-VN')}đ.`,
    data: result,
  });
});
