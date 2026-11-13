import { Job } from 'bullmq';
import prisma from '../../core/database';
import { emitToUser } from '../../core/socket';
import { sendTelegramNotification } from '../../modules/telegram/telegram.bot';
import logger from '../../core/logger';
import type { NotificationJobData } from '../../core/queue';

export async function processNotificationJob(job: Job<NotificationJobData>) {
  const { userId, type, title, message, data } = job.data;

  // Persist notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: type as any,
      title,
      message,
      data,
    },
  });

  // Push realtime via Socket.io
  emitToUser(userId, 'notification:new', notification);

  // Send to Telegram if linked
  try {
    await sendTelegramNotification(userId, `🔔 *${title}*\n\n${message}`);
  } catch (err) {
    logger.warn(`Telegram notification skipped for ${userId}:`, err);
  }

  logger.debug(`Notification sent to user ${userId}: ${title}`);
}
