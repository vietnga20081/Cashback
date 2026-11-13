import { Request, Response } from 'express';
import * as cashbackService from './cashback.service';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, merchantId, status, from, to } = req.query;

  const result = await cashbackService.getCashbackHistory(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    merchantId: merchantId ? Number(merchantId) : undefined,
    status: status as string,
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
  });

  return successResponse(res, { data: result });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await cashbackService.getCashbackStats(req.user!.userId);
  return successResponse(res, { data: stats });
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  let ExcelJS: any = null; try { ExcelJS = await import('exceljs' as any); } catch { ExcelJS = null; }

  const { cashbacks } = await cashbackService.getCashbackHistory(req.user!.userId, { limit: 1000 });

  if (!ExcelJS) {
    // Fallback: CSV export
    const headers = ['Merchant', 'Amount', 'Status', 'Date'];
    const rows = cashbacks.map((cb: any) =>
      [cb.merchant.name, cb.amount, cb.status, new Date(cb.createdAt).toLocaleDateString('vi-VN')].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=cashback-history.csv');
    return res.send(csv);
  }

  const workbook = new ExcelJS.default.Workbook();
  const sheet = workbook.addWorksheet('Cashback History');

  sheet.columns = [
    { header: 'Merchant', key: 'merchant', width: 20 },
    { header: 'Amount (VND)', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Date', key: 'date', width: 20 },
  ];

  cashbacks.forEach((cb: any) => {
    sheet.addRow({
      merchant: cb.merchant.name,
      amount: cb.amount,
      status: cb.status,
      date: new Date(cb.createdAt).toLocaleDateString('vi-VN'),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=cashback-history.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});
