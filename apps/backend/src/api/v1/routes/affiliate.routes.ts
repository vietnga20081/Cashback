import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as affiliateController from '../../../modules/affiliate/affiliate.controller';

export const affiliateRouter = Router();

affiliateRouter.use(authenticate);

affiliateRouter.post('/create', affiliateController.createLink);
affiliateRouter.get('/links', affiliateController.getLinks);
affiliateRouter.delete('/links/:id', affiliateController.deleteLink);
