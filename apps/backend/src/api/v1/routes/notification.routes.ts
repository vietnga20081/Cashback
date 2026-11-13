import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as notificationController from '../../../modules/notification/notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', notificationController.getAll);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/:id/read', notificationController.markRead);
notificationRouter.patch('/read-all', notificationController.markAllRead);
