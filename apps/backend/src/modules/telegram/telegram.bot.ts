import TelegramBot from 'node-telegram-bot-api';
import prisma from '../../core/database';
import { cache } from '../../core/redis';
import logger from '../../core/logger';
import { env } from '../../core/config/env';
import { createAffiliateLink } from '../affiliate/affiliate.service';

let bot: TelegramBot | null = null;

export function getBot(): TelegramBot {
  if (!bot) throw new Error('Telegram bot not initialized');
  return bot;
}

export function initializeTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  const isProduction = env.NODE_ENV === 'production';

  if (isProduction && env.TELEGRAM_WEBHOOK_URL) {
    // Webhook mode for production
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
    bot.setWebHook(`${env.TELEGRAM_WEBHOOK_URL}/api/v1/telegram/webhook`);
  } else {
    // Polling mode for development
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  registerCommands(bot);
  logger.info('Telegram bot started');
}

function registerCommands(bot: TelegramBot) {
  // ─── /start ──────────────────────────────────────────────────────────────────
  bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id.toString();
    const linkToken = match?.[1]; // Deep link token for account linking

    const linked = await prisma.telegramAccount.findUnique({ where: { telegramId } });

    if (linkToken && !linked) {
      // Account linking flow
      const userId = await cache.get<string>(`telegram:link:${linkToken}`);
      if (userId) {
        await prisma.telegramAccount.create({
          data: {
            userId,
            telegramId,
            username: msg.from?.username,
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
          },
        });
        await cache.del(`telegram:link:${linkToken}`);

        await bot.sendMessage(chatId,
          `✅ *Liên kết tài khoản thành công!*\n\nBây giờ bạn sẽ nhận được thông báo cashback qua Telegram.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    const welcomeMsg = linked
      ? `👋 Chào mừng trở lại *${msg.from?.first_name}*!`
      : `👋 Xin chào *${msg.from?.first_name}*!\n\nTôi là bot hỗ trợ của *GreenCash* 🌿\n\nVui lòng liên kết tài khoản từ website để sử dụng đầy đủ tính năng.`;

    await bot.sendMessage(chatId, welcomeMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '💰 Số dư' }, { text: '📊 Lịch sử' }],
          [{ text: '🔗 Tạo link' }, { text: '💸 Rút tiền' }],
          [{ text: '👤 Thông tin' }, { text: '❓ Trợ giúp' }],
        ],
        resize_keyboard: true,
      },
    });
  });

  // ─── /link (generate affiliate link) ────────────────────────────────────────
  bot.onText(/\/link (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id.toString();
    const url = match![1];

    const account = await prisma.telegramAccount.findUnique({ where: { telegramId } });
    if (!account) {
      await bot.sendMessage(chatId, '❌ Bạn chưa liên kết tài khoản. Vui lòng liên kết từ website GreenCash.');
      return;
    }

    await bot.sendMessage(chatId, '⏳ Đang tạo link cashback...');

    try {
      const result = await createAffiliateLink(account.userId, url);
      await bot.sendMessage(chatId,
        `✅ *Link Cashback đã sẵn sàng!*\n\n` +
        `🛍 Merchant: ${result.merchantName}\n` +
        `💰 Cashback dự kiến: ${result.estimatedCashback ? Number(result.estimatedCashback).toLocaleString('vi-VN') + 'đ' : 'N/A'}\n\n` +
        `🔗 Link của bạn:\n\`${result.trackingUrl}\`\n\n` +
        `_Click vào link trên để mua hàng và nhận cashback_`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await bot.sendMessage(chatId, `❌ ${err.message || 'Không thể tạo link. Vui lòng thử lại.'}`);
    }
  });

  // ─── /wallet ─────────────────────────────────────────────────────────────────
  bot.onText(/\/wallet|💰 Số dư/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id.toString();

    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: { user: { include: { wallet: true } } },
    });

    if (!account) {
      await bot.sendMessage(chatId, '❌ Bạn chưa liên kết tài khoản GreenCash.');
      return;
    }

    const wallet = account.user.wallet;
    if (!wallet) {
      await bot.sendMessage(chatId, '❌ Ví không tồn tại.');
      return;
    }

    await bot.sendMessage(chatId,
      `💰 *Ví GreenCash của bạn*\n\n` +
      `✅ Số dư khả dụng: *${Number(wallet.availableBalance).toLocaleString('vi-VN')}đ*\n` +
      `⏳ Đang chờ: ${Number(wallet.pendingBalance).toLocaleString('vi-VN')}đ\n` +
      `📈 Tổng cashback: ${Number(wallet.totalEarned).toLocaleString('vi-VN')}đ\n` +
      `📤 Đã rút: ${Number(wallet.totalWithdrawn).toLocaleString('vi-VN')}đ`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /history ────────────────────────────────────────────────────────────────
  bot.onText(/\/history|📊 Lịch sử/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id.toString();

    const account = await prisma.telegramAccount.findUnique({ where: { telegramId } });
    if (!account) {
      await bot.sendMessage(chatId, '❌ Bạn chưa liên kết tài khoản.');
      return;
    }

    const cashbacks = await prisma.cashback.findMany({
      where: { userId: account.userId },
      include: { merchant: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!cashbacks.length) {
      await bot.sendMessage(chatId, '📭 Chưa có cashback nào.');
      return;
    }

    const statusEmoji: Record<string, string> = {
      PENDING: '⏳', CONFIRMED: '✅', PAID: '💰', CANCELLED: '❌', REJECTED: '🚫',
    };

    const lines = cashbacks.map(cb =>
      `${statusEmoji[cb.status] || '•'} *${cb.merchant.name}* — ${Number(cb.amount).toLocaleString('vi-VN')}đ (${cb.status})`
    ).join('\n');

    await bot.sendMessage(chatId,
      `📊 *5 cashback gần nhất:*\n\n${lines}\n\n_Xem thêm tại website GreenCash_`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /profile ────────────────────────────────────────────────────────────────
  bot.onText(/\/profile|👤 Thông tin/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id.toString();

    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId },
      include: { user: true },
    });

    if (!account) {
      await bot.sendMessage(chatId, '❌ Bạn chưa liên kết tài khoản.');
      return;
    }

    const u = account.user;
    const referralCount = await prisma.referral.count({ where: { fromUserId: u.id } });

    await bot.sendMessage(chatId,
      `👤 *Thông tin tài khoản*\n\n` +
      `📧 Email: ${u.email}\n` +
      `👤 Họ tên: ${u.fullName}\n` +
      `🎁 Mã giới thiệu: \`${u.referralCode}\`\n` +
      `👥 Số người giới thiệu: ${referralCount}\n` +
      `📅 Tham gia: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /help ───────────────────────────────────────────────────────────────────
  bot.onText(/\/help|❓ Trợ giúp/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId,
      `❓ *Hướng dẫn sử dụng GreenCash Bot*\n\n` +
      `📌 Các lệnh:\n` +
      `/start — Bắt đầu\n` +
      `/link <url> — Tạo link cashback\n` +
      `/wallet — Xem số dư ví\n` +
      `/history — Lịch sử cashback\n` +
      `/profile — Thông tin tài khoản\n` +
      `/withdraw — Yêu cầu rút tiền\n` +
      `/help — Trợ giúp\n\n` +
      `🌐 Website: greencash.vn\n` +
      `📧 Hỗ trợ: support@greencash.vn`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── /withdraw ───────────────────────────────────────────────────────────────
  bot.onText(/\/withdraw|💸 Rút tiền/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId,
      `💸 *Rút tiền*\n\nVui lòng truy cập website GreenCash để thực hiện yêu cầu rút tiền.\n\n🌐 greencash.vn/dashboard/withdraw`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle unknown messages
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (msg.text?.startsWith('/') && !msg.text.startsWith('/link')) {
      // Unknown command
    }
  });

  bot.on('polling_error', (err) => {
    logger.error('Telegram polling error:', err);
  });
}

// ─── Send notification to user via Telegram ───────────────────────────────────

export async function sendTelegramNotification(userId: string, message: string) {
  if (!bot) return;

  const account = await prisma.telegramAccount.findUnique({
    where: { userId },
    select: { telegramId: true, isActive: true },
  });

  if (!account || !account.isActive) return;

  try {
    await bot.sendMessage(account.telegramId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error(`Failed to send Telegram message to ${account.telegramId}:`, err);
  }
}
