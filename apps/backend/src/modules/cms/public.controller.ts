import { Request, Response } from 'express';
import prisma from '../../core/database';
import { asyncHandler, successResponse } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/AppError';
import { cache } from '../../core/redis';
import { getPagination } from '../../shared/utils/helpers';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get('public:stats');
  if (cached) return successResponse(res, { data: cached });

  const [totalUsers, totalOrders, settingsRows] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['CASHBACK_APPROVED', 'CASHBACK_PAID'] } } }),
    prisma.setting.findMany({ where: { key: { in: ['total_users', 'total_cashback_paid'] } } }),
  ]);

  const displayUsers = settingsRows.find(s => s.key === 'total_users')?.value;
  const displayCashback = settingsRows.find(s => s.key === 'total_cashback_paid')?.value;

  const data = {
    totalUsers: Math.max(totalUsers, Number(displayUsers || 0)),
    totalOrders,
    totalCashback: `₫${(Number(displayCashback || 0) / 1_000_000_000).toFixed(1)} tỷ`,
  };

  await cache.set('public:stats', data, 600);

  return successResponse(res, { data });
});

export const getMerchants = asyncHandler(async (_req: Request, res: Response) => {
  const merchants = await prisma.merchant.findMany({ where: { isActive: true } });
  return successResponse(res, { data: merchants });
});

export const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page as string, req.query.limit as string);
  const { category } = req.query;

  const where: any = { status: 'PUBLISHED' };
  if (category) where.category = category;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, slug: true, title: true, excerpt: true, thumbnail: true,
        category: true, views: true, publishedAt: true,
      },
    }),
    prisma.blog.count({ where }),
  ]);

  return successResponse(res, { data: { blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const getBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });

  if (!blog || blog.status !== 'PUBLISHED') throw new AppError('Bài viết không tồn tại.', 404);

  await prisma.blog.update({ where: { id: blog.id }, data: { views: { increment: 1 } } });

  return successResponse(res, { data: blog });
});

export const getFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return successResponse(res, { data: faqs });
});

export const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const { position } = req.query;

  const where: any = { isActive: true };
  if (position) where.position = position;

  const now = new Date();
  where.AND = [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ];

  const banners = await prisma.banner.findMany({ where, orderBy: { sortOrder: 'asc' } });

  return successResponse(res, { data: banners });
});

export const getCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.cmsPage.findUnique({ where: { slug: req.params.slug } });

  if (!page || page.status !== 'PUBLISHED') throw new AppError('Trang không tồn tại.', 404);

  return successResponse(res, { data: page });
});
