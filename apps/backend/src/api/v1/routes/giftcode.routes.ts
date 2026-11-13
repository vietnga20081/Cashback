import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as giftcodeController from '../../../modules/giftcode/giftcode.controller';

export const giftcodeRouter = Router();

giftcodeRouter.use(authenticate);

giftcodeRouter.post('/redeem', giftcodeController.redeem);
