import { Router } from 'express';
import * as authController from '../../../modules/auth/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, otpSchema, resetPasswordSchema } from '../validators/auth.validator';

export const authRouter = Router();

// Public
authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', authRateLimiter, authController.forgotPassword);
authRouter.post('/reset-password', authRateLimiter, authController.resetPassword);
authRouter.post('/send-otp', authRateLimiter, authController.sendOtp);
authRouter.post('/verify-otp', authRateLimiter, authController.verifyOtp);
authRouter.post('/verify-2fa', authRateLimiter, authController.verify2FA);

// Protected
authRouter.post('/setup-2fa', authenticate, authController.setup2FA);
authRouter.post('/enable-2fa', authenticate, authController.enable2FA);
