import { Job } from 'bullmq';
import prisma from '../../core/database';
import logger from '../../core/logger';

interface WithdrawalJobData {
  withdrawId: string;
  action: 'auto-process' | 'check-status';
}

export async function processWithdrawalJob(job: Job<WithdrawalJobData>) {
  const { withdrawId, action } = job.data;

  if (action === 'auto-process') {
    const withdraw = await prisma.withdraw.findUnique({ where: { id: withdrawId } });
    if (!withdraw || withdraw.status !== 'PENDING') return;

    // Placeholder for actual payment gateway integration (bank transfer API, Momo API, etc.)
    logger.info(`Processing withdrawal ${withdrawId} via ${withdraw.method}`);

    // In production this would call the actual payment provider API
    // For now, mark as processing - admin manually approves
    await prisma.withdraw.update({
      where: { id: withdrawId },
      data: { status: 'PROCESSING' },
    });
  }
}
