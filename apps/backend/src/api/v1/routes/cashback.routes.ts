import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as cashbackController from '../../../modules/cashback/cashback.controller';

export const cashbackRouter = Router();

cashbackRouter.use(authenticate);

cashbackRouter.get('/history', cashbackController.getHistory);
cashbackRouter.get('/stats', cashbackController.getStats);
cashbackRouter.get('/export', cashbackController.exportExcel);
