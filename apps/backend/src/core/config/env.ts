import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('GreenCash'),
  APP_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // JWT
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  // Email (SMTP)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_NAME: z.string().default('GreenCash'),
  SMTP_FROM_EMAIL: z.string(),

  // Encryption
  ENCRYPTION_KEY: z.string(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),

  // Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB

  // Affiliate - Shopee
  SHOPEE_AFFILIATE_PUBLISHER_ID: z.string().optional(),
  SHOPEE_AFFILIATE_API_KEY: z.string().optional(),
  SHOPEE_AFFILIATE_SECRET: z.string().optional(),

  // Affiliate - TikTok
  TIKTOK_AFFILIATE_APP_ID: z.string().optional(),
  TIKTOK_AFFILIATE_APP_SECRET: z.string().optional(),
  TIKTOK_AFFILIATE_ACCESS_TOKEN: z.string().optional(),

  // Affiliate - Lazada
  LAZADA_AFFILIATE_APP_KEY: z.string().optional(),
  LAZADA_AFFILIATE_APP_SECRET: z.string().optional(),
  LAZADA_AFFILIATE_ACCESS_TOKEN: z.string().optional(),

  // Minimum withdrawal amount (VND)
  MIN_WITHDRAW_AMOUNT: z.coerce.number().default(50000),

  // Referral commission rates
  REFERRAL_F1_RATE: z.coerce.number().default(5),   // 5% of cashback
  REFERRAL_F2_RATE: z.coerce.number().default(3),   // 3%
  REFERRAL_F3_RATE: z.coerce.number().default(1),   // 1%
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
