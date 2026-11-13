import { Job } from 'bullmq';
import prisma from '../../core/database';
import { addNotificationJob } from '../../core/queue';
import { processReferralCommissions } from '../../modules/referral/referral.service';
import logger from '../../core/logger';

interface CashbackSyncJobData {
  action: 'sync-orders' | 'confirm-cashback' | 'auto-approve';
  merchantType?: string;
  orderId?: string;
}

export async function processCashbackSyncJob(job: Job<CashbackSyncJobData>) {
  const { action } = job.data;
  switch (action) {
    case 'sync-orders':     return syncMerchantOrders(job.data.merchantType);
    case 'confirm-cashback': return confirmCashback(job.data.orderId!);
    case 'auto-approve':    return autoApprovePendingCashbacks();
    default: logger.warn(`Unknown cashback sync action: ${action}`);
  }
}

// ─── Sync orders from merchant APIs ──────────────────────────────────────────

async function syncMerchantOrders(merchantType?: string) {
  const merchants = await prisma.merchant.findMany({
    where: merchantType ? { type: merchantType as any } : { isActive: true },
  });
  for (const merchant of merchants) {
    logger.info(`Syncing orders for merchant: ${merchant.name}`);
    // Hook: call merchant's affiliate API to pull new orders
    // Create Order + Cashback records here when real API is integrated
  }
}

// ─── Confirm + pay a single cashback ─────────────────────────────────────────

export async function confirmCashback(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { cashback: true },
  });

  if (!order?.cashback) {
    logger.warn(`Order ${orderId} or cashback not found`);
    return;
  }
  if (order.cashback.status !== 'PENDING') return;

  const cashbackAmount = Number(order.cashback.amount);

  await prisma.$transaction(async (tx) => {
    // 1. Mark cashback confirmed
    await tx.cashback.update({
      where: { id: order.cashback!.id },
      data: { status: 'CONFIRMED', approvedAt: new Date() },
    });

    // 2. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CASHBACK_APPROVED', confirmedAt: new Date() },
    });

    // 3. Credit cashback to user's wallet (inside tx — no separate service call)
    const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) throw new Error(`Wallet not found for user ${order.userId}`);

    await tx.wallet.update({
      where: { userId: order.userId },
      data: {
        availableBalance: { increment: cashbackAmount },
        totalEarned:      { increment: cashbackAmount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId:      wallet.id,
        type:          'CASHBACK_RECEIVED',
        status:        'COMPLETED',
        amount:        cashbackAmount,
        balanceBefore: wallet.availableBalance,
        balanceAfter:  Number(wallet.availableBalance) + cashbackAmount,
        description:   `Cashback từ đơn hàng ${order.externalOrderId || order.id.slice(0, 8)}`,
        referenceId:   order.id,
        referenceType: 'ORDER',
      },
    });

    // 4. Mark cashback PAID
    await tx.cashback.update({
      where: { id: order.cashback!.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CASHBACK_PAID', cashbackPaidAt: new Date() },
    });

    // 5. Distribute referral commissions (all inside same tx — no nested transactions)
    await processReferralCommissions(tx, order.userId, order.id, cashbackAmount);
  });

  // 6. Notifications (outside tx — non-critical)
  await addNotificationJob({
    userId: order.userId,
    type: 'CASHBACK',
    title: 'Cashback đã được thanh toán! 🎉',
    message: `Bạn vừa nhận ${cashbackAmount.toLocaleString('vi-VN')}đ cashback.`,
    data: { orderId },
  });

  logger.info(`Cashback paid for order ${orderId}: ${cashbackAmount}đ`);
}

// ─── Auto-approve cashbacks past waiting period ───────────────────────────────

async function autoApprovePendingCashbacks() {
  const settingsRow = await prisma.setting.findUnique({ where: { key: 'cashback_auto_approve_days' } });
  const days = settingsRow ? Number(settingsRow.value) : 15;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pendingCashbacks = await prisma.cashback.findMany({
    where: { status: 'PENDING', createdAt: { lte: cutoffDate } },
    select: { orderId: true },
    take: 50, // process in batches
  });

  let success = 0, failed = 0;
  for (const cb of pendingCashbacks) {
    try {
      await confirmCashback(cb.orderId);
      success++;
    } catch (err) {
      logger.error(`Auto-approve failed for order ${cb.orderId}:`, err);
      failed++;
    }
  }

  logger.info(`Auto-approve: ${success} success, ${failed} failed out of ${pendingCashbacks.length}`);
}
