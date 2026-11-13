import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as referralController from '../../../modules/referral/referral.controller';

export const referralRouter = Router();

referralRouter.use(authenticate);

// GET /api/v1/referral — full stats (referralCode, counts, commission breakdown)
referralRouter.get('/', referralController.getInfo);

// backward compat
referralRouter.get('/stats', referralController.getStats);

// GET /api/v1/referral/network?level=1&page=1
referralRouter.get('/network', referralController.getNetwork);

// GET /api/v1/referral/commissions?level=F1&status=PAID&page=1
referralRouter.get('/commissions', referralController.getCommissions);
