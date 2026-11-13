import { Router } from 'express';
import * as publicController from '../../../modules/cms/public.controller';

export const publicRouter = Router();

publicRouter.get('/stats', publicController.getStats);
publicRouter.get('/merchants', publicController.getMerchants);
publicRouter.get('/blogs', publicController.getBlogs);
publicRouter.get('/blogs/:slug', publicController.getBlog);
publicRouter.get('/faqs', publicController.getFaqs);
publicRouter.get('/banners', publicController.getBanners);
publicRouter.get('/pages/:slug', publicController.getCmsPage);
