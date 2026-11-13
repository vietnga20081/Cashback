import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../../../modules/auth/auth.service';
import { AppError } from '../../../shared/utils/AppError';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Vui lòng đăng nhập để tiếp tục.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Phiên đăng nhập đã hết hạn.', 401));
    }
    return next(new AppError('Token không hợp lệ.', 401));
  }
}

export function requireRole(...roles: number[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Chưa xác thực.', 401));
    if (!roles.includes(req.user.roleId)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này.', 403));
    }
    next();
  };
}

// Admin only
export const adminOnly = requireRole(1);

// Optional auth (doesn't fail if no token)
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // ignore
    }
  }
  next();
}
