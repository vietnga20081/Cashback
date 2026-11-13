import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as merchantController from '../../../modules/merchant/merchant.controller';

export const merchantRouter = Router();

merchantRouter.get('/', merchantController.getAll);
merchantRouter.get('/:id', merchantController.getOne);
