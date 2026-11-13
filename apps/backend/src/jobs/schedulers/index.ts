import cron from 'node-cron';
import { getQueue, QUEUE_NAMES } from '../../core/queue';
import logger from '../../core/logger';

export function startSchedulers() {
  // Sync orders from merchants every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running scheduled job: sync-orders');
    await getQueue(QUEUE_NAMES.CASHBACK_SYNC).add('sync-orders', { action: 'sync-orders' });
  });

  // Auto-approve pending cashbacks daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled job: auto-approve-cashbacks');
    await getQueue(QUEUE_NAMES.CASHBACK_SYNC).add('auto-approve', { action: 'auto-approve' });
  });

  // Cleanup expired tokens every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled job: cleanup-expired-tokens');
    await getQueue(QUEUE_NAMES.CLEANUP).add('cleanup', { target: 'expired-tokens' });
  });

  // Cleanup old logs daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running scheduled job: cleanup-old-logs');
    await getQueue(QUEUE_NAMES.CLEANUP).add('cleanup', { target: 'old-logs' });
    await getQueue(QUEUE_NAMES.CLEANUP).add('cleanup', { target: 'old-notifications' });
  });

  // Deactivate expired affiliate links daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running scheduled job: deactivate-expired-links');
    await getQueue(QUEUE_NAMES.CLEANUP).add('cleanup', { target: 'expired-links' });
  });

  logger.info('All cron schedulers registered');
}
