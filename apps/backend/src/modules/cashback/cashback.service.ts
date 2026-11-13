import prisma from '../../core/database';
import { getPagination } from '../../shared/utils/helpers';

export async function getCashbackHistory(userId: string, filters: {
  page?: number;
  limit?: number;
  merchantId?: number;
  status?: string;
  from?: Date;
  to?: Date;
}) {
  const { page, limit, skip } = getPagination(filters.page || 1, filters.limit || 20);

  const where: any = { userId };
  if (filters.merchantId) where.merchantId = filters.merchantId;
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const [cashbacks, total] = await Promise.all([
    prisma.cashback.findMany({
      where,
      include: { merchant: true, order: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cashback.count({ where }),
  ]);

  return { cashbacks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getCashbackStats(userId: string) {
  const [totalPending, totalConfirmed, totalPaid, byMerchant] = await Promise.all([
    prisma.cashback.aggregate({
      where: { userId, status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cashback.aggregate({
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cashback.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cashback.groupBy({
      by: ['merchantId'],
      where: { userId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const merchants = await prisma.merchant.findMany();
  const merchantMap = new Map(merchants.map((m: any) => [m.id, m]));

  return {
    pending: { amount: totalPending._sum.amount || 0, count: totalPending._count },
    confirmed: { amount: totalConfirmed._sum.amount || 0, count: totalConfirmed._count },
    paid: { amount: totalPaid._sum.amount || 0, count: totalPaid._count },
    byMerchant: byMerchant.map(item => ({
      merchant: (merchantMap.get(item.merchantId) as any)?.name || 'Unknown',
      amount: item._sum.amount,
      count: item._count,
    })),
  };
}
