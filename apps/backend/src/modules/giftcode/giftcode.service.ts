import prisma from '../../core/database';
import { AppError } from '../../shared/utils/AppError';
import { creditWallet } from '../wallet/wallet.service';

export async function redeemGiftcode(userId: string, code: string) {
  const giftcode = await prisma.giftcode.findUnique({ where: { code: code.toUpperCase() } });

  if (!giftcode) throw new AppError('Mã giftcode không tồn tại.', 404);
  if (!giftcode.isActive) throw new AppError('Mã giftcode đã bị khóa.', 400);
  if (giftcode.expiresAt && giftcode.expiresAt < new Date()) {
    throw new AppError('Mã giftcode đã hết hạn.', 400);
  }
  if (giftcode.usageLimit && giftcode.usageCount >= giftcode.usageLimit) {
    throw new AppError('Mã giftcode đã hết lượt sử dụng.', 400);
  }

  // Check per-user limit
  const userUsageCount = await prisma.giftcodeLog.count({
    where: { giftcodeId: giftcode.id, userId },
  });

  if (userUsageCount >= giftcode.perUserLimit) {
    throw new AppError('Bạn đã sử dụng hết số lần cho phép với mã này.', 400);
  }

  // Calculate benefit
  let benefit = 0;
  if (giftcode.type === 'FIXED' || giftcode.type === 'CASHBACK_BONUS') {
    benefit = Number(giftcode.value);
  } else if (giftcode.type === 'PERCENT') {
    // For percent type, this would normally apply to next purchase; here we apply directly as bonus
    benefit = Number(giftcode.value);
    if (giftcode.maxDiscount) benefit = Math.min(benefit, Number(giftcode.maxDiscount));
  }

  await prisma.$transaction(async (tx) => {
    await tx.giftcode.update({
      where: { id: giftcode.id },
      data: { usageCount: { increment: 1 } },
    });

    await tx.giftcodeLog.create({
      data: { giftcodeId: giftcode.id, userId, benefit },
    });

    if (benefit > 0 && giftcode.type !== 'PERCENT') {
      await creditWallet(
        userId,
        benefit,
        'GIFTCODE_BONUS',
        `Nhận thưởng từ giftcode ${giftcode.code}`,
        giftcode.id,
        'GIFTCODE',
        tx
      );
    }
  });

  return { code: giftcode.code, benefit, type: giftcode.type };
}
