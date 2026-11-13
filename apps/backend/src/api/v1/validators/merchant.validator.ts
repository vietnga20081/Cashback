import { z } from 'zod';

export const updateMerchantSchema = z.object({
  body: z.object({
    baseCommission: z.number().min(0).max(100).optional(),
    userCommission: z.number().min(0).max(100).optional(),
    cookieDuration: z.number().int().min(1).max(365).optional(),
    trackingDomain: z.string().max(255).optional().nullable(),
    isActive: z.boolean().optional(),
    apiConfig: z
      .object({
        mode: z.enum(['api', 'network', 'accesstrade', 'demo']).optional(),
        networkProvider: z.string().max(100).optional(),
        linkTemplate: z.string().max(1000).optional(),
        accesstradeCampaignId: z.string().max(100).optional(),
      })
      .optional()
      .nullable(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID không hợp lệ'),
  }),
});

export const testAffiliateLinkSchema = z.object({
  body: z.object({
    url: z.string().url('URL không hợp lệ'),
    merchantType: z.enum(['SHOPEE', 'TIKTOK', 'LAZADA']).optional(),
  }),
});
