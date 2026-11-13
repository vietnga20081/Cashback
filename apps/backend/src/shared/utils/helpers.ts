import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/database';
import { nanoid } from 'nanoid';

// ─── Async Handler ────────────────────────────────────────────────────────────

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

export function successResponse(
  res: Response,
  data: { message?: string; data?: unknown; meta?: unknown },
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

// ─── Generate Referral Code ───────────────────────────────────────────────────

export async function generateReferralCode(): Promise<string> {
  let code: string;
  let exists: boolean;

  do {
    code = nanoid(8).toUpperCase();
    const user = await prisma.user.findUnique({ where: { referralCode: code } });
    exists = !!user;
  } while (exists);

  return code;
}

// ─── Generate Short Code for Affiliate Links ──────────────────────────────────

export async function generateShortCode(): Promise<string> {
  let code: string;
  let exists: boolean;

  do {
    code = nanoid(10);
    const link = await prisma.affiliateLink.findUnique({ where: { shortCode: code } });
    exists = !!link;
  } while (exists);

  return code;
}

// ─── Pagination Helper ────────────────────────────────────────────────────────

export function getPagination(page: number | string, limit: number | string) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

// ─── Format Currency (VND) ────────────────────────────────────────────────────

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ─── Date Helpers ──────────────────────────────────────────────────────────────

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

// ─── Mask Email ───────────────────────────────────────────────────────────────

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

// ─── Sanitize User (remove sensitive fields) ─────────────────────────────────

export function sanitizeUser(user: any) {
  const { passwordHash, twoFactorSecret, ...safe } = user;
  return safe;
}
