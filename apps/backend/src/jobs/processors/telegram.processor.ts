import { Job } from 'bullmq';
import { getBot } from '../../modules/telegram/telegram.bot';
import logger from '../../core/logger';
import type { TelegramJobData } from '../../core/queue';

export async function processTelegramJob(job: Job<TelegramJobData>) {
  const { telegramId, message, parseMode } = job.data;

  try {
    const bot = getBot();
    await bot.sendMessage(telegramId, message, { parse_mode: parseMode || 'Markdown' });
  } catch (err) {
    logger.error(`Failed to send Telegram message to ${telegramId}:`, err);
    throw err;
  }
}
