import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import * as userController from '../../../modules/user/user.controller';

const upload = multer({ dest: 'uploads/avatars/', limits: { fileSize: 5 * 1024 * 1024 } });

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/profile', userController.getProfile);
userRouter.patch('/profile', userController.updateProfile);
userRouter.post('/avatar', upload.single('avatar'), userController.uploadAvatar);
userRouter.post('/change-password', userController.changePassword);
userRouter.get('/activity-logs', userController.getActivityLogs);

userRouter.get('/saved-products', userController.getSavedProducts);
userRouter.post('/saved-products', userController.saveProduct);
userRouter.delete('/saved-products/:id', userController.deleteSavedProduct);

userRouter.post('/telegram/link', userController.linkTelegram);
userRouter.get('/telegram/link-token', userController.generateTelegramLinkToken);
