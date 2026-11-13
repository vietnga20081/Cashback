import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from '../config/env';
import logger from '../logger';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: 1, // Use separate DB for queues
};

// ─── Queue Definitions ────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  CASHBACK_SYNC: 'cashback-sync',
  WITHDRAWAL: 'withdrawal',
  TELEGRAM: 'telegram',
  CLEANUP: 'cleanup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues: Map<string, Queue> = new Map();
const workers: Map<string, Worker> = new Map();

export function getQueue(name: QueueName): Queue {
  const q = queues.get(name);
  if (!q) throw new Error(`Queue "${name}" not found`);
  return q;
}

export async function initializeQueues(): Promise<void> {
  const defaultJobOptions = {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
  };

  // Create all queues
  for (const name of Object.values(QUEUE_NAMES)) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions,
    });

    const queueEvents = new QueueEvents(name, { connection });

    queueEvents.on('completed', ({ jobId }) => {
      logger.debug(`Job ${jobId} completed in queue "${name}"`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed in queue "${name}": ${failedReason}`);
    });

    queues.set(name, queue);
    logger.debug(`Queue "${name}" initialized`);
  }

  // Register workers
  await registerWorkers();
}

async function registerWorkers(): Promise<void> {
  const { processEmailJob } = await import('../../jobs/processors/email.processor');
  const { processNotificationJob } = await import('../../jobs/processors/notification.processor');
  const { processCashbackSyncJob } = await import('../../jobs/processors/cashback.processor');
  const { processWithdrawalJob } = await import('../../jobs/processors/withdrawal.processor');
  const { processTelegramJob } = await import('../../jobs/processors/telegram.processor');
  const { processCleanupJob } = await import('../../jobs/processors/cleanup.processor');

  const processorMap: Record<string, (job: any) => Promise<any>> = {
    [QUEUE_NAMES.EMAIL]: processEmailJob,
    [QUEUE_NAMES.NOTIFICATION]: processNotificationJob,
    [QUEUE_NAMES.CASHBACK_SYNC]: processCashbackSyncJob,
    [QUEUE_NAMES.WITHDRAWAL]: processWithdrawalJob,
    [QUEUE_NAMES.TELEGRAM]: processTelegramJob,
    [QUEUE_NAMES.CLEANUP]: processCleanupJob,
  };

  for (const [name, processor] of Object.entries(processorMap)) {
    const worker = new Worker(name, processor, {
      connection,
      concurrency: name === QUEUE_NAMES.EMAIL ? 5 : 3,
    });

    worker.on('error', (err) => {
      logger.error(`Worker error in "${name}":`, err);
    });

    workers.set(name, worker);
  }
}

// ─── Job Helpers ──────────────────────────────────────────────────────────────

export async function addEmailJob(data: EmailJobData, options?: object) {
  return getQueue(QUEUE_NAMES.EMAIL).add('send-email', data, options);
}

export async function addNotificationJob(data: NotificationJobData) {
  return getQueue(QUEUE_NAMES.NOTIFICATION).add('push-notification', data);
}

export async function addTelegramJob(data: TelegramJobData) {
  return getQueue(QUEUE_NAMES.TELEGRAM).add('send-telegram', data);
}

// ─── Job Data Types ───────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string;
  templateName?: string;
  subject?: string;
  html?: string;
  variables?: Record<string, string | number>;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface TelegramJobData {
  telegramId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}
