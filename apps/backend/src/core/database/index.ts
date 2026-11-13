const { PrismaClient } = require('@prisma/client');
import logger from '../logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any;
}

// Singleton pattern to avoid multiple connections in development
const prisma = globalThis.__prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 500) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
export default prisma;
