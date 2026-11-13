import { Application, Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { walletRouter } from './wallet.routes';
import { affiliateRouter } from './affiliate.routes';
import { cashbackRouter } from './cashback.routes';
import { withdrawRouter } from './withdraw.routes';
import { referralRouter } from './referral.routes';
import { giftcodeRouter } from './giftcode.routes';
import { notificationRouter } from './notification.routes';
import { merchantRouter } from './merchant.routes';
import { adminRouter } from './admin.routes';
import { publicRouter } from './public.routes';
import { trackingRouter } from './tracking.routes';

export function registerRoutes(app: Application): void {
  const v1 = Router();

  // Public routes (no auth required)
  v1.use('/public', publicRouter);
  v1.use('/tracking', trackingRouter);

  // Auth routes
  v1.use('/auth', authRouter);

  // User routes (auth required)
  v1.use('/user', userRouter);
  v1.use('/wallet', walletRouter);
  v1.use('/affiliate', affiliateRouter);
  v1.use('/cashback', cashbackRouter);
  v1.use('/withdraw', withdrawRouter);
  v1.use('/referral', referralRouter);
  v1.use('/giftcode', giftcodeRouter);
  v1.use('/notifications', notificationRouter);
  v1.use('/merchants', merchantRouter);

  // Admin routes
  v1.use('/admin', adminRouter);

  app.use('/api/v1', v1);
}
