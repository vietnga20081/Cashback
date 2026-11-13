import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as walletController from '../../../modules/wallet/wallet.controller';

export const walletRouter = Router();

walletRouter.use(authenticate);

walletRouter.get('/', walletController.getWallet);
walletRouter.get('/stats', walletController.getStats);
walletRouter.get('/transactions', walletController.getTransactions);
