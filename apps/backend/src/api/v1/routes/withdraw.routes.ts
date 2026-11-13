import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { withdrawRateLimiter } from '../middlewares/rateLimiter.middleware';
import * as withdrawController from '../../../modules/wallet/withdraw.controller';

export const withdrawRouter = Router();

withdrawRouter.use(authenticate);

withdrawRouter.post('/request', withdrawRateLimiter, withdrawController.requestWithdraw);
withdrawRouter.get('/list', withdrawController.getWithdrawals);
withdrawRouter.get('/accounts', withdrawController.getAccounts);
withdrawRouter.post('/accounts', withdrawController.addAccount);
withdrawRouter.delete('/accounts/:id', withdrawController.deleteAccount);
