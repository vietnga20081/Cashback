// Shared TypeScript types between frontend and backend
// Import in backend: import type { ApiResponse } from '@greencash/shared'

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type MerchantType = 'SHOPEE' | 'TIKTOK' | 'LAZADA' | 'OTHER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CASHBACK_PENDING'
  | 'CASHBACK_APPROVED'
  | 'CASHBACK_PAID'
  | 'CANCELLED'
  | 'REJECTED';

export type WithdrawStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export type WithdrawMethod = 'BANK_TRANSFER' | 'MOMO' | 'ZALOPAY' | 'USDT';
