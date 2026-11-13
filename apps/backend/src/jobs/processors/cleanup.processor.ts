import { Job } from 'bullmq';
import prisma from '../../core/database';
import logger from '../../core/logger';

interface CleanupJobData {
  target: 'expired-tokens' | 'old-logs' | 'old-notifications' | 'expired-links';
}

export async function processCleanupJob(job: Job<CleanupJobData>) {
  const { target } = job.data;

  switch (target) {
    case 'expired-tokens': {
      const result = await prisma.refreshToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }] },
      });
      logger.info(`Cleaned up ${result.count} expired/revoked refresh tokens`);

      const sessionResult = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info(`Cleaned up ${sessionResult.count} expired sessions`);
      break;
    }

    case 'old-logs': {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const activityResult = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      logger.info(`Cleaned up ${activityResult.count} old activity logs`);
      break;
    }

    case 'old-notifications': {
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days
      const result = await prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff }, isRead: true },
      });
      logger.info(`Cleaned up ${result.count} old read notifications`);
      break;
    }

    case 'expired-links': {
      const result = await prisma.affiliateLink.updateMany({
        where: { expiresAt: { lt: new Date() }, isActive: true },
        data: { isActive: false },
      });
      logger.info(`Deactivated ${result.count} expired affiliate links`);
      break;
    }
  }
}
