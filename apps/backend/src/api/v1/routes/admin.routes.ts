import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import * as adminController from '../../../modules/admin/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, adminOnly);

// Dashboard
adminRouter.get('/stats', adminController.getDashboardStats);

// Users
adminRouter.get('/users', adminController.getUsers);
adminRouter.get('/users/:id', adminController.getUser);
adminRouter.patch('/users/:id', adminController.updateUser);
adminRouter.post('/users/:id/ban', adminController.banUser);
adminRouter.post('/users/:id/unban', adminController.unbanUser);

// Orders
adminRouter.get('/orders', adminController.getOrders);
adminRouter.patch('/orders/:id', adminController.updateOrder);

// Withdrawals
adminRouter.get('/withdrawals', adminController.getWithdrawals);
adminRouter.post('/withdrawals/:id/approve', adminController.approveWithdraw);
adminRouter.post('/withdrawals/:id/reject', adminController.rejectWithdraw);

// Merchants
adminRouter.get('/merchants', adminController.getMerchants);
adminRouter.get('/merchants/accesstrade-campaigns', adminController.getAccesstradeCampaigns);
adminRouter.post('/merchants/accesstrade-campaigns/sync', adminController.syncAccesstradeCampaigns);
adminRouter.patch('/merchants/:id', adminController.updateMerchant);

// Giftcodes
adminRouter.get('/giftcodes', adminController.getGiftcodes);
adminRouter.post('/giftcodes', adminController.createGiftcode);
adminRouter.patch('/giftcodes/:id', adminController.updateGiftcode);
adminRouter.delete('/giftcodes/:id', adminController.deleteGiftcode);

// CMS Pages
adminRouter.get('/cms', adminController.getCmsPages);
adminRouter.post('/cms', adminController.createCmsPage);
adminRouter.patch('/cms/:id', adminController.updateCmsPage);
adminRouter.delete('/cms/:id', adminController.deleteCmsPage);

// Blogs
adminRouter.get('/blogs', adminController.getBlogsAdmin);
adminRouter.post('/blogs', adminController.createBlog);
adminRouter.patch('/blogs/:id', adminController.updateBlog);
adminRouter.delete('/blogs/:id', adminController.deleteBlog);

// Banners
adminRouter.get('/banners', adminController.getBanners);
adminRouter.post('/banners', adminController.createBanner);
adminRouter.patch('/banners/:id', adminController.updateBanner);
adminRouter.delete('/banners/:id', adminController.deleteBanner);

// Settings
adminRouter.get('/settings', adminController.getSettings);
adminRouter.patch('/settings/:key', adminController.updateSetting);

// Roles & Permissions
adminRouter.get('/roles', adminController.getRoles);
adminRouter.get('/permissions', adminController.getPermissions);

// Audit logs
adminRouter.get('/audit-logs', adminController.getAuditLogs);
