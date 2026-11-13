import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) return true;
      return false;
    },
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  redisClient.on('ready', () => logger.info('Redis ready'));

  await redisClient.connect();
}

// ─── Redis Cache Helpers ──────────────────────────────────────────────────────

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const redis = getRedis();
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, data);
    } else {
      await redis.set(key, data);
    }
  },

  async del(key: string | string[]): Promise<void> {
    const redis = getRedis();
    if (Array.isArray(key)) {
      await redis.del(...key);
    } else {
      await redis.del(key);
    }
  },

  async exists(key: string): Promise<boolean> {
    const redis = getRedis();
    return (await redis.exists(key)) === 1;
  },

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const redis = getRedis();
    const val = await redis.incr(key);
    if (ttlSeconds && val === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return val;
  },

  // Pattern-based deletion
  async delPattern(pattern: string): Promise<void> {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_WALLET: (id: string) => `wallet:${id}`,
  SETTINGS: 'settings:all',
  MERCHANTS: 'merchants:all',
  OTP: (email: string, type: string) => `otp:${type}:${email}`,
  RATE_LIMIT: (key: string) => `rl:${key}`,
  REFRESH_TOKEN_BLACKLIST: (token: string) => `rt:bl:${token}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
};
