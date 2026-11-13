import { Request, Response, NextFunction } from 'express';

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function successResponse(
  res: Response,
  data: { message?: string; data?: unknown; meta?: unknown },
  statusCode = 200
) {
  return res.status(statusCode).json({ success: true, ...data });
}
