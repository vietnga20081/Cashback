
import { createApp } from './app';
import { connectDatabase } from './core/database';
import { connectRedis } from './core/redis';
import { initializeQueues } from './core/queue';
import { initializeSocket } from './core/socket';
import { startSchedulers } from './jobs/schedulers';
import { initializeTelegramBot } from './modules/telegram/telegram.bot';
import logger from './core/logger';
import http from 'http';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Initialize queues
    await initializeQueues();
    logger.info('✅ BullMQ queues initialized');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocket(server);
    logger.info('✅ Socket.io initialized');

    // Start schedulers
    startSchedulers();
    logger.info('✅ Schedulers started');

    // Initialize Telegram bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      initializeTelegramBot();
      logger.info('✅ Telegram bot initialized');
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 GreenCash API running on port ${PORT}`);
      logger.info(`📖 Swagger docs: http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
