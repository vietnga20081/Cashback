import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/utils/AppError';
import logger from '../../../core/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log the error
  if ((err as AppError).statusCode >= 500 || !(err instanceof AppError)) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      user: req.user?.userId,
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data }),
    });
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Dữ liệu đã tồn tại.',
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu.',
      });
    }
  }

  // Zod validation errors
  if (err.constructor.name === 'ZodError') {
    const zodErr = err as any;
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: zodErr.errors.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token đã hết hạn.' });
  }

  // Unknown errors
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống, vui lòng thử lại sau.',
    ...(isDev && { error: err.message, stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} không tồn tại.`,
  });
}
