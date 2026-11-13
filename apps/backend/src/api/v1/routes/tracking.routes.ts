import { Router, Request, Response } from 'express';
import * as affiliateService from '../../../modules/affiliate/affiliate.service';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export const trackingRouter = Router();

trackingRouter.get('/:shortCode', asyncHandler(async (req: Request, res: Response) => {
  const targetUrl = await affiliateService.trackLinkClick(req.params.shortCode, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  if (!targetUrl) {
    return res.status(404).send('Link không tồn tại hoặc đã hết hạn.');
  }

  res.redirect(302, targetUrl);
}));
