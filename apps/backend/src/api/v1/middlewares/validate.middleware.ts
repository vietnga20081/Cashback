import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = result.body ?? req.body;
      next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: err.errors?.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
  };
}
