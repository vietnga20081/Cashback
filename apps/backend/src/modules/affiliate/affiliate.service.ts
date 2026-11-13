import axios from 'axios';
import prisma from '../../core/database';
import { cache } from '../../core/redis';
import { AppError } from '../../shared/utils/AppError';
import { generateShortCode } from '../../shared/utils/helpers';
import { env } from '../../core/config/env';
type MerchantType = 'SHOPEE' | 'TIKTOK' | 'LAZADA' | 'OTHER';

// ─── URL Detection ────────────────────────────────────────────────────────────

export function detectMerchant(url: string): MerchantType | null {
  const normalized = url.toLowerCase();
  if (normalized.includes('shopee.vn') || normalized.includes('shp.ee')) return 'SHOPEE';
  if (normalized.includes('tiktok.com') || normalized.includes('tikto.vn')) return 'TIKTOK';
  if (normalized.includes('lazada.vn') || normalized.includes('lzd.co')) return 'LAZADA';
  return null;
}

// ─── URL Expansion ────────────────────────────────────────────────────────────

async function expandShortUrl(url: string): Promise<string> {
  try {
    const response = await axios.head(url, {
      maxRedirects: 10,
      timeout: 5000,
    });
    return response.request?.res?.responseUrl || url;
  } catch {
    return url;
  }
}

// ─── Product Info Extraction ──────────────────────────────────────────────────

async function extractShopeeProduct(url: string) {
  // Extract product ID from Shopee URL patterns:
  // https://shopee.vn/product-name-i.shopId.itemId
  const match = url.match(/i\.(\d+)\.(\d+)/);
  if (!match) return null;

  const [, shopId, itemId] = match;
  const productId = `${shopId}.${itemId}`;

  // Call Shopee Open API if credentials available
  // For now, return extracted IDs
  return { productId, shopId, itemId };
}

async function extractTikTokProduct(url: string) {
  // TikTok Shop URL: https://www.tiktok.com/@shop/item/itemId
  const match = url.match(/\/item\/(\w+)/);
  if (!match) return null;
  return { productId: match[1] };
}

async function extractLazadaProduct(url: string) {
  // Lazada URL: https://www.lazada.vn/products/name-i{productId}-s{skuId}.html
  const match = url.match(/i(\d+)-s(\d+)/);
  if (!match) return null;
  return { productId: match[1], skuId: match[2] };
}

// ─── Affiliate Link Generation ────────────────────────────────────────────────

async function generateShopeeAffiliateLink(
  originalUrl: string,
  userId: string
): Promise<string> {
  if (!env.SHOPEE_AFFILIATE_PUBLISHER_ID) {
    // Demo mode: add tracking params
    const url = new URL(originalUrl);
    url.searchParams.set('af_siteid', 'greencash');
    url.searchParams.set('af_sub4', userId);
    return url.toString();
  }

  // Production: Call Shopee Affiliate API
  try {
    const response = await axios.post(
      'https://affiliate.shopee.vn/api/v2/links',
      {
        original_url: originalUrl,
        publisher_id: env.SHOPEE_AFFILIATE_PUBLISHER_ID,
        sub_id: userId,
      },
      {
        headers: {
          Authorization: `Bearer ${env.SHOPEE_AFFILIATE_API_KEY}`,
        },
        timeout: 10000,
      }
    );
    return response.data.affiliate_url;
  } catch (error) {
    // Fallback to demo mode
    const url = new URL(originalUrl);
    url.searchParams.set('af_siteid', 'greencash');
    url.searchParams.set('af_sub4', userId);
    return url.toString();
  }
}

async function generateTikTokAffiliateLink(
  originalUrl: string,
  userId: string
): Promise<string> {
  if (!env.TIKTOK_AFFILIATE_APP_ID) {
    const url = new URL(originalUrl);
    url.searchParams.set('ref', 'greencash');
    url.searchParams.set('sub', userId);
    return url.toString();
  }

  // Production: TikTok Affiliate API
  try {
    const response = await axios.post(
      'https://open-api.tiktokglobalshop.com/api/affiliate/link',
      { url: originalUrl, sub_id: userId },
      {
        headers: { 'x-tts-access-token': env.TIKTOK_AFFILIATE_ACCESS_TOKEN },
      }
    );
    return response.data.data.affiliate_link;
  } catch {
    return originalUrl;
  }
}

async function generateLazadaAffiliateLink(
  originalUrl: string,
  userId: string
): Promise<string> {
  if (!env.LAZADA_AFFILIATE_APP_KEY) {
    const url = new URL(originalUrl);
    url.searchParams.set('laz_trackid', `greencash_${userId}`);
    return url.toString();
  }

  // Production: Lazada Affiliate API
  try {
    const response = await axios.get(
      'https://api.lazada.vn/rest/affiliate/link/generate',
      {
        params: {
          app_key: env.LAZADA_AFFILIATE_APP_KEY,
          access_token: env.LAZADA_AFFILIATE_ACCESS_TOKEN,
          original_url: originalUrl,
          tracking_id: userId,
        },
      }
    );
    return response.data.result.affiliate_url;
  } catch {
    return originalUrl;
  }
}

// ─── Main Service Function ────────────────────────────────────────────────────

export async function createAffiliateLink(userId: string, originalUrl: string) {
  // Expand short URLs first
  let expandedUrl = originalUrl;
  if (originalUrl.includes('shp.ee') || originalUrl.includes('lzd.co')) {
    expandedUrl = await expandShortUrl(originalUrl);
  }

  // Detect merchant
  const merchantType = detectMerchant(expandedUrl);
  if (!merchantType) {
    throw new AppError('URL không được hỗ trợ. Vui lòng dùng link từ Shopee, TikTok Shop hoặc Lazada.', 400);
  }

  // Get merchant config
  const merchant = await prisma.merchant.findUnique({ where: { type: merchantType } });
  if (!merchant || !merchant.isActive) {
    throw new AppError('Merchant hiện không khả dụng.', 400);
  }

  // Extract product info
  let productInfo: any = {};
  if (merchantType === 'SHOPEE') productInfo = await extractShopeeProduct(expandedUrl) || {};
  if (merchantType === 'TIKTOK') productInfo = await extractTikTokProduct(expandedUrl) || {};
  if (merchantType === 'LAZADA') productInfo = await extractLazadaProduct(expandedUrl) || {};

  // Generate affiliate link
  let affiliateUrl: string;
  if (merchantType === 'SHOPEE') affiliateUrl = await generateShopeeAffiliateLink(expandedUrl, userId);
  else if (merchantType === 'TIKTOK') affiliateUrl = await generateTikTokAffiliateLink(expandedUrl, userId);
  else affiliateUrl = await generateLazadaAffiliateLink(expandedUrl, userId);

  // Calculate estimated cashback
  const userWallet = await prisma.wallet.findUnique({ where: { userId } });
  const estimatedCashback = productInfo.price
    ? (productInfo.price * Number(merchant.baseCommission) * Number(merchant.userCommission)) / 10000
    : undefined;

  // Generate short code and save
  const shortCode = await generateShortCode();
  const affiliateLink = await prisma.affiliateLink.create({
    data: {
      userId,
      merchantId: merchant.id,
      originalUrl: expandedUrl,
      affiliateUrl,
      shortCode,
      productId: productInfo.productId,
      estimatedCashback,
      expiresAt: new Date(Date.now() + merchant.cookieDuration * 24 * 60 * 60 * 1000),
    },
    include: { merchant: true },
  });

  return {
    ...affiliateLink,
    trackingUrl: `${env.APP_URL}/go/${shortCode}`,
    cashbackPercent: Number(merchant.userCommission),
    merchantName: merchant.name,
    merchantLogo: merchant.logo,
  };
}

export async function getUserAffiliateLinks(
  userId: string,
  filters: { merchantId?: number; page?: number; limit?: number }
) {
  const { page = 1, limit = 20, merchantId } = filters;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (merchantId) where.merchantId = merchantId;

  const [links, total] = await Promise.all([
    prisma.affiliateLink.findMany({
      where,
      include: { merchant: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.affiliateLink.count({ where }),
  ]);

  return {
    links: links.map(link => ({
      ...link,
      trackingUrl: `${env.APP_URL}/go/${link.shortCode}`,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function trackLinkClick(shortCode: string, meta: {
  ip?: string;
  userAgent?: string;
}) {
  const link = await prisma.affiliateLink.findUnique({ where: { shortCode } });
  if (!link || !link.isActive) return null;

  // Increment click count
  await prisma.affiliateLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  return link.affiliateUrl;
}
