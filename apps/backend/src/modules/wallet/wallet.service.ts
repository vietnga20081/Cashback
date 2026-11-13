import prisma from '../../core/database';
import { AppError } from '../../shared/utils/AppError';
import { env } from '../../core/config/env';
import { addNotificationJob } from '../../core/queue';
type WithdrawMethod = 'BANK_TRANSFER' | 'MOMO' | 'ZALOPAY' | 'USDT';

// ─── Get Wallet ───────────────────────────────────────────────────────────────

export async function getUserWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!wallet) throw new AppError('Ví không tồn tại.', 404);
  return wallet;
}

export async function getWalletTransactions(
  userId: string,
  filters: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
    from?: Date;
    to?: Date;
  }
) {
  const { page = 1, limit = 20, type, status, from, to } = filters;
  const skip = (page - 1) * limit;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new AppError('Ví không tồn tại.', 404);

  const where: any = { walletId: wallet.id };
  if (type) where.type = type;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// ─── Credit/Debit Wallet (Internal) ──────────────────────────────────────────

export async function creditWallet(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  referenceType?: string,
  tx?: any
) {
  const db = tx || prisma;
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new AppError('Ví không tồn tại.', 404);

  const newBalance = Number(wallet.availableBalance) + amount;

  await db.wallet.update({
    where: { userId },
    data: {
      availableBalance: { increment: amount },
      totalEarned: { increment: amount },
    },
  });

  await db.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type,
      status: 'COMPLETED',
      amount,
      balanceBefore: wallet.availableBalance,
      balanceAfter: newBalance,
      description,
      referenceId,
      referenceType,
    },
  });
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  tx?: any
) {
  const db = tx || prisma;
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new AppError('Ví không tồn tại.', 404);

  if (Number(wallet.availableBalance) < amount) {
    throw new AppError('Số dư không đủ.', 400);
  }

  const newBalance = Number(wallet.availableBalance) - amount;

  await db.wallet.update({
    where: { userId },
    data: { availableBalance: { decrement: amount } },
  });

  await db.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type,
      status: 'COMPLETED',
      amount: -amount,
      balanceBefore: wallet.availableBalance,
      balanceAfter: newBalance,
      description,
      referenceId,
    },
  });
}

// ─── Withdrawal Request ───────────────────────────────────────────────────────

export async function requestWithdrawal(
  userId: string,
  data: {
    accountId: string;
    amount: number;
  }
) {
  if (data.amount < env.MIN_WITHDRAW_AMOUNT) {
    throw new AppError(
      `Số tiền rút tối thiểu là ${env.MIN_WITHDRAW_AMOUNT.toLocaleString('vi-VN')}đ.`,
      400
    );
  }

  const [wallet, account] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.withdrawAccount.findFirst({
      where: { id: data.accountId, userId },
    }),
  ]);

  if (!wallet) throw new AppError('Ví không tồn tại.', 404);
  if (!account) throw new AppError('Tài khoản rút tiền không tồn tại.', 404);
  if (Number(wallet.availableBalance) < data.amount) {
    throw new AppError('Số dư không đủ để rút.', 400);
  }

  // Calculate fee (if any)
  const fee = 0; // Can add fee logic here
  const netAmount = data.amount - fee;

  const withdraw = await prisma.$transaction(async (tx) => {
    // Lock balance (move to pending)
    await tx.wallet.update({
      where: { userId },
      data: {
        availableBalance: { decrement: data.amount },
      },
    });

    const wd = await tx.withdraw.create({
      data: {
        userId,
        accountId: data.accountId,
        amount: data.amount,
        fee,
        netAmount,
        method: account.method as WithdrawMethod,
        status: 'PENDING',
      },
      include: { account: true },
    });

    // Log transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        amount: -data.amount,
        balanceBefore: wallet.availableBalance,
        balanceAfter: Number(wallet.availableBalance) - data.amount,
        description: `Yêu cầu rút tiền qua ${account.method}`,
        referenceId: wd.id,
        referenceType: 'WITHDRAW',
      },
    });

    return wd;
  });

  // Send notification
  await addNotificationJob({
    userId,
    type: 'WITHDRAWAL',
    title: 'Yêu cầu rút tiền đã được gửi',
    message: `Yêu cầu rút ${data.amount.toLocaleString('vi-VN')}đ đang chờ xử lý.`,
    data: { withdrawId: withdraw.id },
  });

  return withdraw;
}

export async function getUserWithdrawals(
  userId: string,
  filters: { status?: string; page?: number; limit?: number }
) {
  const { page = 1, limit = 20, status } = filters;
  const where: any = { userId };
  if (status) where.status = status;

  const [withdrawals, total] = await Promise.all([
    prisma.withdraw.findMany({
      where,
      include: { account: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.withdraw.count({ where }),
  ]);

  return {
    withdrawals,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// ─── Withdraw Accounts ────────────────────────────────────────────────────────

export async function addWithdrawAccount(
  userId: string,
  data: {
    method: WithdrawMethod;
    accountName: string;
    accountNo: string;
    bankCode?: string;
    bankName?: string;
  }
) {
  // Limit to 5 accounts per user
  const count = await prisma.withdrawAccount.count({ where: { userId } });
  if (count >= 5) throw new AppError('Bạn chỉ có thể thêm tối đa 5 tài khoản.', 400);

  const isFirst = count === 0;

  return prisma.withdrawAccount.create({
    data: {
      ...data,
      userId,
      isDefault: isFirst,
    },
  });
}

export async function getUserWithdrawAccounts(userId: string) {
  return prisma.withdrawAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

// ─── Wallet Stats ─────────────────────────────────────────────────────────────

export async function getWalletStats(userId: string, period: 'week' | 'month' | 'year' = 'month') {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new AppError('Ví không tồn tại.', 404);

  const now = new Date();
  let startDate: Date;

  if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else startDate = new Date(now.getFullYear(), 0, 1);

  // Get daily cashback chart data
  const dailyCashback = await prisma.$queryRaw<any[]>`
    SELECT
      DATE(wt.createdAt) as date,
      SUM(CASE WHEN wt.type = 'CASHBACK_RECEIVED' THEN wt.amount ELSE 0 END) as cashback,
      SUM(CASE WHEN wt.type = 'REFERRAL_COMMISSION' THEN wt.amount ELSE 0 END) as commission
    FROM wallet_transactions wt
    WHERE wt.walletId = ${wallet.id}
      AND wt.createdAt >= ${startDate}
      AND wt.status = 'COMPLETED'
    GROUP BY DATE(wt.createdAt)
    ORDER BY date ASC
  `;

  return {
    balance: {
      available: wallet.availableBalance,
      pending: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
    },
    chart: dailyCashback,
  };
}
