import prisma from '../../core/database';
import { env } from '../../core/config/env';
import logger from '../../core/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferralMember {
  id: string;
  fullName: string;
  avatar: string | null;
  email: string;
  joinedAt: Date;
  totalCashback: number;
  totalOrders: number;
  commissionEarned: number;
  level: 1 | 2 | 3;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  f1Count: number;
  f2Count: number;
  f3Count: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  commissionThisMonth: number;
  topReferrer: boolean;
  // Per-level breakdown
  f1Commission: number;
  f2Commission: number;
  f3Commission: number;
}

// ─── Get full referral info + stats ──────────────────────────────────────────

export async function getReferralInfo(userId: string): Promise<ReferralStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (!user) throw new Error('User not found');

  // Count members at each level
  const [f1Count, f2Count, f3Count] = await Promise.all([
    prisma.referral.count({ where: { fromUserId: userId, level: 1 } }),
    prisma.referral.count({ where: { fromUserId: userId, level: 2 } }),
    prisma.referral.count({ where: { fromUserId: userId, level: 3 } }),
  ]);

  // Commission stats grouped by level and status
  const commissionRows = await prisma.commission.groupBy({
    by: ['level', 'status'],
    where: { userId },
    _sum: { amount: true },
  });

  const getAmount = (level: string, status: string) =>
    Number(commissionRows.find(r => r.level === level && r.status === status)?._sum.amount || 0);

  const f1Commission = getAmount('F1', 'PAID');
  const f2Commission = getAmount('F2', 'PAID');
  const f3Commission = getAmount('F3', 'PAID');
  const totalCommission = f1Commission + f2Commission + f3Commission;

  const pendingCommission =
    Number(commissionRows.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + Number(r._sum.amount || 0), 0));

  // Commission this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const commissionThisMonth = await prisma.commission.aggregate({
    where: { userId, status: 'PAID', paidAt: { gte: startOfMonth } },
    _sum: { amount: true },
  });

  return {
    referralCode: user.referralCode,
    totalReferrals: f1Count + f2Count + f3Count,
    f1Count,
    f2Count,
    f3Count,
    totalCommission,
    pendingCommission,
    paidCommission: totalCommission,
    commissionThisMonth: Number(commissionThisMonth._sum.amount || 0),
    topReferrer: f1Count >= 10,
    f1Commission,
    f2Commission,
    f3Commission,
  };
}

// ─── Get referral network (F1, F2, F3 with details) ─────────────────────────

export async function getReferralNetwork(
  userId: string,
  level: 1 | 2 | 3 = 1,
  page = 1,
  limit = 20
): Promise<{ members: ReferralMember[]; total: number; page: number; pages: number }> {
  const skip = (page - 1) * limit;

  // Get referral records for requested level
  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { fromUserId: userId, level },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referral.count({ where: { fromUserId: userId, level } }),
  ]);

  if (!referrals.length) return { members: [], total, page, pages: Math.ceil(total / limit) };

  const memberIds = referrals.map(r => r.toUserId);

  // Fetch user info + their cashback totals + orders
  const [users, cashbackTotals, orderCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, fullName: true, avatar: true, email: true, createdAt: true },
    }),
    prisma.cashback.groupBy({
      by: ['userId'],
      where: { userId: { in: memberIds }, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: memberIds } },
      _count: { id: true },
    }),
  ]);

  // Commission earned from each member
  const commissionsFromMembers = await prisma.commission.groupBy({
    by: ['sourceUserId'],
    where: {
      userId,
      sourceUserId: { in: memberIds },
      status: 'PAID',
    },
    _sum: { amount: true },
  });

  const members: ReferralMember[] = users.map(u => {
    const ref = referrals.find(r => r.toUserId === u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      avatar: u.avatar,
      email: u.email.replace(/(.{2}).*@/, '$1***@'), // mask email
      joinedAt: ref?.createdAt ?? u.createdAt,
      totalCashback: Number(cashbackTotals.find(c => c.userId === u.id)?._sum.amount || 0),
      totalOrders: orderCounts.find(o => o.userId === u.id)?._count.id || 0,
      commissionEarned: Number(commissionsFromMembers.find(c => c.sourceUserId === u.id)?._sum.amount || 0),
      level: (ref?.level ?? 1) as 1 | 2 | 3,
    };
  });

  // Sort by commission earned descending
  members.sort((a, b) => b.commissionEarned - a.commissionEarned);

  return { members, total, page, pages: Math.ceil(total / limit) };
}

// ─── Commission history ────────────────────────────────────────────────────────

export async function getCommissionHistory(
  userId: string,
  filters: { level?: string; status?: string; page?: number; limit?: number }
) {
  const { level, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (level) where.level = level;
  if (status) where.status = status;

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: {
        // sourceUser via raw query since no direct relation in schema
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.commission.count({ where }),
  ]);

  // Fetch source user names
  const sourceUserIds = [...new Set(commissions.map(c => c.sourceUserId))];
  const sourceUsers = await prisma.user.findMany({
    where: { id: { in: sourceUserIds } },
    select: { id: true, fullName: true },
  });
  const sourceUserMap = new Map(sourceUsers.map(u => [u.id, u.fullName]));

  return {
    commissions: commissions.map(c => ({
      ...c,
      sourceUserName: sourceUserMap.get(c.sourceUserId) || 'Unknown',
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// ─── Process referral commission after cashback paid ─────────────────────────
// Called inside a Prisma transaction from cashback processor

export async function processReferralCommissions(
  tx: any,
  userId: string,
  orderId: string,
  cashbackAmount: number
): Promise<void> {
  // Get the referral chain for this user (who referred them at F1/F2/F3)
  const referrals = await tx.referral.findMany({
    where: { toUserId: userId },
    orderBy: { level: 'asc' },
  });

  if (!referrals.length) return;

  // Get rates from settings (with fallback to env)
  const settingKeys = ['referral_f1_rate', 'referral_f2_rate', 'referral_f3_rate'];
  const settings = await tx.setting.findMany({ where: { key: { in: settingKeys } } });
  const getSetting = (key: string, fallback: number) =>
    Number(settings.find((s: any) => s.key === key)?.value ?? fallback);

  const rates: Record<number, number> = {
    1: getSetting('referral_f1_rate', env.REFERRAL_F1_RATE) / 100,
    2: getSetting('referral_f2_rate', env.REFERRAL_F2_RATE) / 100,
    3: getSetting('referral_f3_rate', env.REFERRAL_F3_RATE) / 100,
  };

  const levelMap: Record<number, 'F1' | 'F2' | 'F3'> = { 1: 'F1', 2: 'F2', 3: 'F3' };

  for (const referral of referrals) {
    const rate = rates[referral.level];
    if (!rate || rate <= 0) continue;

    const commissionAmount = Math.floor(cashbackAmount * rate); // floor to avoid fractions
    if (commissionAmount <= 0) continue;

    const referrerId = referral.fromUserId;

    // Check referrer still active
    const referrer = await tx.user.findUnique({
      where: { id: referrerId },
      select: { status: true },
    });
    if (!referrer || referrer.status === 'BANNED') continue;

    // Prevent duplicate commission for same order+referrer
    const existing = await tx.commission.findFirst({
      where: { userId: referrerId, orderId, level: levelMap[referral.level] },
    });
    if (existing) continue;

    // Create commission record
    await tx.commission.create({
      data: {
        userId: referrerId,
        sourceUserId: userId,
        orderId,
        level: levelMap[referral.level],
        rate: rate * 100,
        amount: commissionAmount,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Credit referrer wallet INSIDE the same tx (use tx directly, not creditWallet service)
    const wallet = await tx.wallet.findUnique({ where: { userId: referrerId } });
    if (!wallet) continue;

    const newBalance = Number(wallet.availableBalance) + commissionAmount;

    await tx.wallet.update({
      where: { userId: referrerId },
      data: {
        availableBalance: { increment: commissionAmount },
        totalEarned: { increment: commissionAmount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'REFERRAL_COMMISSION',
        status: 'COMPLETED',
        amount: commissionAmount,
        balanceBefore: wallet.availableBalance,
        balanceAfter: newBalance,
        description: `Hoa hồng ${levelMap[referral.level]} từ đơn hàng #${orderId.slice(0, 8)}`,
        referenceId: orderId,
        referenceType: 'COMMISSION',
      },
    });

    logger.debug(`Commission ${levelMap[referral.level]}: ${commissionAmount} → user ${referrerId}`);
  }
}

// ─── Build referral chain when a new user registers ──────────────────────────

export async function buildReferralChain(
  tx: any,
  newUserId: string,
  referrerId: string
): Promise<void> {
  // F1: direct referral (upsert on compound unique [toUserId, level])
  await tx.referral.upsert({
    where: { toUserId_level: { toUserId: newUserId, level: 1 } },
    create: { fromUserId: referrerId, toUserId: newUserId, level: 1 },
    update: {},
  });

  // F2: who referred the referrer?
  const f1Chain = await tx.referral.findFirst({
    where: { toUserId: referrerId, level: 1 },
  });
  if (f1Chain) {
    await tx.referral.create({
      data: { fromUserId: f1Chain.fromUserId, toUserId: newUserId, level: 2 },
    }).catch(() => {}); // ignore duplicate

    // F3: who referred f1Chain.fromUserId?
    const f2Chain = await tx.referral.findFirst({
      where: { toUserId: f1Chain.fromUserId, level: 1 },
    });
    if (f2Chain) {
      await tx.referral.create({
        data: { fromUserId: f2Chain.fromUserId, toUserId: newUserId, level: 3 },
      }).catch(() => {});
    }
  }
}
