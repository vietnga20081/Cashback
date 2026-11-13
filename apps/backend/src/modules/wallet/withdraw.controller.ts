import { Request, Response } from 'express';
import * as walletService from './wallet.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import prisma from '../../core/database';

export const requestWithdraw = asyncHandler(async (req: Request, res: Response) => {
  const { accountId, amount } = req.body;

  const withdraw = await walletService.requestWithdrawal(req.user!.userId, { accountId, amount });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.userId,
      action: 'REQUEST_WITHDRAW',
      description: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ`,
      ipAddress: req.ip,
    },
  });

  return successResponse(res, { message: 'Yêu cầu rút tiền đã được gửi.', data: withdraw }, 201);
});

export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;

  const result = await walletService.getUserWithdrawals(req.user!.userId, {
    status: status as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return successResponse(res, { data: result });
});

export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await walletService.getUserWithdrawAccounts(req.user!.userId);
  return successResponse(res, { data: accounts });
});

export const addAccount = asyncHandler(async (req: Request, res: Response) => {
  const { method, accountName, accountNo, bankCode, bankName } = req.body;

  const account = await walletService.addWithdrawAccount(req.user!.userId, {
    method, accountName, accountNo, bankCode, bankName,
  });

  return successResponse(res, { message: 'Đã thêm tài khoản rút tiền.', data: account }, 201);
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await prisma.withdrawAccount.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!account) throw new AppError('Tài khoản không tồn tại.', 404);

  await prisma.withdrawAccount.delete({ where: { id: account.id } });

  return successResponse(res, { message: 'Đã xóa tài khoản.' });
});
