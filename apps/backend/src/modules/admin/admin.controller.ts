import { Request, Response } from 'express';
import prisma from '../../core/database';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import { getPagination, sanitizeUser, startOfDay, endOfDay } from '../../shared/utils/helpers';
import { creditWallet, debitWallet } from '../wallet/wallet.service';
import { addNotificationJob } from '../../core/queue';
import { cache } from '../../core/redis';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = startOfDay(new Date());

  const [
    totalUsers, newUsersToday, totalOrders, ordersToday,
    cashbackSum, pendingWithdrawals, withdrawStatusCounts,
    recentWithdrawals, revenueChart,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.cashback.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.withdraw.count({ where: { status: 'PENDING' } }),
    prisma.withdraw.groupBy({ by: ['status'], _count: true }),
    prisma.withdraw.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.$queryRaw<any[]>`
      SELECT DATE(createdAt) as date, SUM(amount) as cashback
      FROM cashbacks
      WHERE status = 'PAID' AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
  ]);

  const withdrawStats: Record<string, number> = {};
  withdrawStatusCounts.forEach((w) => {
    withdrawStats[w.status.toLowerCase()] = w._count;
  });

  return successResponse(res, {
    data: {
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      totalCashback: cashbackSum._sum.amount || 0,
      pendingWithdrawals,
      withdrawStats,
      recentWithdrawals,
      revenueChart,
    },
  });
});

// ─── Users Management ─────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);
  const { search, status, roleId } = req.query;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search as string } },
      { fullName: { contains: search as string } },
    ];
  }
  if (status) where.status = status;
  if (roleId) where.roleId = Number(roleId);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { wallet: true, role: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return successResponse(res, {
    data: {
      users: users.map(sanitizeUser),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { wallet: true, role: true, referrals: true },
  });

  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  return successResponse(res, { data: sanitizeUser(user) });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, status, roleId } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { fullName, status, roleId },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      after: { fullName, status, roleId },
      ipAddress: req.ip,
    },
  });

  return successResponse(res, { message: 'Cập nhật thành công.', data: sanitizeUser(user) });
});

export const banUser = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'BANNED' } });

  await prisma.refreshToken.updateMany({
    where: { userId: req.params.id },
    data: { isRevoked: true },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'UPDATE', entity: 'user', entityId: req.params.id, after: { status: 'BANNED' } },
  });

  return successResponse(res, { message: 'Đã khóa tài khoản.' });
});

export const unbanUser = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
  return successResponse(res, { message: 'Đã mở khóa tài khoản.' });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);
  const { status, merchantId, search } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (merchantId) where.merchantId = Number(merchantId);
  if (search) where.externalOrderId = { contains: search as string };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } }, merchant: true, cashback: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return successResponse(res, { data: { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
  });

  return successResponse(res, { message: 'Cập nhật đơn hàng thành công.', data: order });
});

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);
  const { status } = req.query;

  const where: any = {};
  if (status) where.status = status;

  const [withdrawals, total] = await Promise.all([
    prisma.withdraw.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } }, account: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.withdraw.count({ where }),
  ]);

  return successResponse(res, { data: { withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const approveWithdraw = asyncHandler(async (req: Request, res: Response) => {
  const withdraw = await prisma.withdraw.findUnique({ where: { id: req.params.id } });
  if (!withdraw) throw new AppError('Yêu cầu rút tiền không tồn tại.', 404);
  if (withdraw.status !== 'PENDING' && withdraw.status !== 'PROCESSING') {
    throw new AppError('Yêu cầu này đã được xử lý.', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.withdraw.update({
      where: { id: withdraw.id },
      data: { status: 'COMPLETED', processedAt: new Date(), processedById: req.user!.userId },
    });

    await tx.wallet.update({
      where: { userId: withdraw.userId },
      data: { totalWithdrawn: { increment: withdraw.amount } },
    });

    await tx.walletTransaction.updateMany({
      where: { referenceId: withdraw.id, referenceType: 'WITHDRAW' },
      data: { status: 'COMPLETED' },
    });
  });

  await addNotificationJob({
    userId: withdraw.userId,
    type: 'WITHDRAWAL',
    title: 'Yêu cầu rút tiền đã được duyệt! 💰',
    message: `${Number(withdraw.amount).toLocaleString('vi-VN')}đ đã được chuyển đến tài khoản của bạn.`,
  });

  return successResponse(res, { message: 'Đã duyệt yêu cầu rút tiền.' });
});

export const rejectWithdraw = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const withdraw = await prisma.withdraw.findUnique({ where: { id: req.params.id } });
  if (!withdraw) throw new AppError('Yêu cầu rút tiền không tồn tại.', 404);

  await prisma.$transaction(async (tx) => {
    await tx.withdraw.update({
      where: { id: withdraw.id },
      data: { status: 'REJECTED', adminNote: reason, processedAt: new Date(), processedById: req.user!.userId },
    });

    // Refund balance
    await tx.wallet.update({
      where: { userId: withdraw.userId },
      data: { availableBalance: { increment: withdraw.amount } },
    });

    await tx.walletTransaction.updateMany({
      where: { referenceId: withdraw.id, referenceType: 'WITHDRAW' },
      data: { status: 'CANCELLED' },
    });
  });

  await addNotificationJob({
    userId: withdraw.userId,
    type: 'WITHDRAWAL',
    title: 'Yêu cầu rút tiền bị từ chối',
    message: reason || 'Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.',
  });

  return successResponse(res, { message: 'Đã từ chối yêu cầu rút tiền.' });
});

// ─── Merchants ────────────────────────────────────────────────────────────────

export const getMerchants = asyncHandler(async (_req: Request, res: Response) => {
  const merchants = await prisma.merchant.findMany();
  return successResponse(res, { data: merchants });
});

export const updateMerchant = asyncHandler(async (req: Request, res: Response) => {
  const merchant = await prisma.merchant.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });

  await cache.del('merchants:all');

  return successResponse(res, { message: 'Cập nhật merchant thành công.', data: merchant });
});

// ─── Giftcodes ────────────────────────────────────────────────────────────────

export const getGiftcodes = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);

  const [giftcodes, total] = await Promise.all([
    prisma.giftcode.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.giftcode.count(),
  ]);

  return successResponse(res, { data: { giftcodes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const createGiftcode = asyncHandler(async (req: Request, res: Response) => {
  const giftcode = await prisma.giftcode.create({
    data: { ...req.body, code: req.body.code.toUpperCase() },
  });

  return successResponse(res, { message: 'Tạo giftcode thành công.', data: giftcode }, 201);
});

export const updateGiftcode = asyncHandler(async (req: Request, res: Response) => {
  const giftcode = await prisma.giftcode.update({
    where: { id: req.params.id },
    data: req.body,
  });

  return successResponse(res, { message: 'Cập nhật giftcode thành công.', data: giftcode });
});

export const deleteGiftcode = asyncHandler(async (req: Request, res: Response) => {
  await prisma.giftcode.delete({ where: { id: req.params.id } });
  return successResponse(res, { message: 'Đã xóa giftcode.' });
});

// ─── CMS Pages ────────────────────────────────────────────────────────────────

export const getCmsPages = asyncHandler(async (req: Request, res: Response) => {
  const pages = await prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
  return successResponse(res, { data: pages });
});

export const createCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.cmsPage.create({ data: req.body });
  return successResponse(res, { message: 'Tạo trang thành công.', data: page }, 201);
});

export const updateCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.cmsPage.update({ where: { id: req.params.id }, data: req.body });
  return successResponse(res, { message: 'Cập nhật thành công.', data: page });
});

export const deleteCmsPage = asyncHandler(async (req: Request, res: Response) => {
  await prisma.cmsPage.delete({ where: { id: req.params.id } });
  return successResponse(res, { message: 'Đã xóa trang.' });
});

// ─── Blogs ────────────────────────────────────────────────────────────────────

export const getBlogsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.blog.count(),
  ]);

  return successResponse(res, { data: { blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.status === 'PUBLISHED' && !data.publishedAt) data.publishedAt = new Date();

  const blog = await prisma.blog.create({ data });
  return successResponse(res, { message: 'Tạo bài viết thành công.', data: blog }, 201);
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.status === 'PUBLISHED' && !data.publishedAt) data.publishedAt = new Date();

  const blog = await prisma.blog.update({ where: { id: req.params.id }, data });
  return successResponse(res, { message: 'Cập nhật thành công.', data: blog });
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await prisma.blog.delete({ where: { id: req.params.id } });
  return successResponse(res, { message: 'Đã xóa bài viết.' });
});

// ─── Banners ──────────────────────────────────────────────────────────────────

export const getBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  return successResponse(res, { data: banners });
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await prisma.banner.create({ data: req.body });
  return successResponse(res, { message: 'Tạo banner thành công.', data: banner }, 201);
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await prisma.banner.update({ where: { id: Number(req.params.id) }, data: req.body });
  return successResponse(res, { message: 'Cập nhật thành công.', data: banner });
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  await prisma.banner.delete({ where: { id: Number(req.params.id) } });
  return successResponse(res, { message: 'Đã xóa banner.' });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const { group } = req.query;
  const where: any = {};
  if (group) where.group = group;

  const settings = await prisma.setting.findMany({ where, orderBy: { group: 'asc' } });
  return successResponse(res, { data: settings });
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.setting.update({
    where: { key: req.params.key },
    data: { value: String(req.body.value) },
  });

  await cache.del('settings:all');

  return successResponse(res, { message: 'Cập nhật cài đặt thành công.', data: setting });
});

// ─── Roles & Permissions ──────────────────────────────────────────────────────

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
  return successResponse(res, { data: roles });
});

export const getPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany({ orderBy: { group: 'asc' } });
  return successResponse(res, { data: permissions });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);
  const { entity, userId } = req.query;

  const where: any = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return successResponse(res, { data: { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});


// ─── AccessTrade Campaigns ────────────────────────────────────────────────────

export const getAccesstradeCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await prisma.setting.findMany({
    where: { group: 'accesstrade' },
  });

  // Parse stored campaigns or return empty
  const stored = campaigns.find((s: any) => s.key === 'accesstrade_campaigns');
  const data = stored ? JSON.parse(stored.value) : [];

  return successResponse(res, {
    data: {
      campaigns: data,
      total: data.length,
      lastSync: campaigns.find((s: any) => s.key === 'accesstrade_last_sync')?.value || null,
    }
  });
});

export const syncAccesstradeCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const apiKeySetting = await prisma.setting.findUnique({ where: { key: 'accesstrade_api_key' } });

  if (!apiKeySetting?.value) {
    return successResponse(res, {
      message: 'AccessTrade API key chưa được cấu hình. Vui lòng thêm vào Settings.',
      data: { campaigns: [], synced: 0 }
    });
  }

  try {
    const axios = require('axios');
    const response = await axios.get('https://api.accesstrade.vn/v1/programs', {
      headers: { 'Authorization': `Token ${apiKeySetting.value}` },
      timeout: 10000,
    });

    const campaigns = response.data?.data || [];

    // Store in settings
    await prisma.setting.upsert({
      where: { key: 'accesstrade_campaigns' },
      create: { key: 'accesstrade_campaigns', value: JSON.stringify(campaigns), type: 'json', group: 'accesstrade' },
      update: { value: JSON.stringify(campaigns) },
    });

    await prisma.setting.upsert({
      where: { key: 'accesstrade_last_sync' },
      create: { key: 'accesstrade_last_sync', value: new Date().toISOString(), type: 'string', group: 'accesstrade' },
      update: { value: new Date().toISOString() },
    });

    return successResponse(res, {
      message: `Đã đồng bộ ${campaigns.length} campaigns từ AccessTrade.`,
      data: { campaigns, synced: campaigns.length }
    });
  } catch (err: any) {
    return successResponse(res, {
      message: 'Không thể kết nối AccessTrade API. Kiểm tra lại API key.',
      data: { campaigns: [], synced: 0, error: err.message }
    });
  }
});
