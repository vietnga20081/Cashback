import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Response interceptor - auto refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;

        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Update store
        const { useAuthStore } = await import('../stores/auth.store');
        useAuthStore.getState().setToken(newToken);

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        // Force logout
        const { useAuthStore } = await import('../stores/auth.store');
        useAuthStore.getState().logout();
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global error handling
    const message = (error.response?.data as any)?.message;

    if (error.response?.status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
    } else if (error.response?.status === 429) {
      toast.error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
    } else if (!error.response) {
      toast.error('Lỗi kết nối. Vui lòng kiểm tra mạng.');
    }

    return Promise.reject(error);
  }
);

// ─── API Services ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; referralCode?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  sendOtp: (email: string, type: string) => api.post('/auth/send-otp', { email, type }),
  verifyOtp: (email: string, otp: string, type: string) =>
    api.post('/auth/verify-otp', { email, otp, type }),
  verify2FA: (tempToken: string, token: string) =>
    api.post('/auth/verify-2fa', { tempToken, token }),
  setup2FA: () => api.post('/auth/setup-2fa'),
  enable2FA: (token: string) => api.post('/auth/enable-2fa', { token }),
};

export const walletApi = {
  getWallet: () => api.get('/wallet'),
  getStats: (period?: string) => api.get(`/wallet/stats${period ? `?period=${period}` : ''}`),
  getTransactions: (params?: object) => api.get('/wallet/transactions', { params }),
  requestWithdraw: (data: { accountId: string; amount: number }) =>
    api.post('/withdraw/request', data),
  getWithdrawals: (params?: object) => api.get('/withdraw/list', { params }),
  getWithdrawAccounts: () => api.get('/withdraw/accounts'),
  addWithdrawAccount: (data: object) => api.post('/withdraw/accounts', data),
  deleteWithdrawAccount: (id: string) => api.delete(`/withdraw/accounts/${id}`),
};

export const affiliateApi = {
  createLink: (url: string) => api.post('/affiliate/create', { url }),
  getLinks: (params?: object) => api.get('/affiliate/links', { params }),
  deleteLink: (id: string) => api.delete(`/affiliate/links/${id}`),
};

export const cashbackApi = {
  getHistory: (params?: object) => api.get('/cashback/history', { params }),
  getStats: () => api.get('/cashback/stats'),
  exportExcel: (params?: object) =>
    api.get('/cashback/export', { params, responseType: 'blob' }),
};

export const referralApi = {
  // Full stats: referralCode, counts, commission breakdown
  getInfo: () => api.get('/referral'),
  // Backward compat alias
  getStats: () => api.get('/referral'),
  // Network at a specific level with pagination
  getNetwork: (level: 1 | 2 | 3 = 1, page = 1, limit = 20) =>
    api.get('/referral/network', { params: { level, page, limit } }),
  // Commission history
  getCommissions: (params?: { level?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/referral/commissions', { params }),
};

export const giftcodeApi = {
  redeem: (code: string) => api.post('/giftcode/redeem', { code }),
};

export const notificationApi = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: object) => api.patch('/user/profile', data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/user/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (data: object) => api.post('/user/change-password', data),
  getActivityLogs: (params?: object) => api.get('/user/activity-logs', { params }),
  getSavedProducts: (params?: object) => api.get('/user/saved-products', { params }),
  saveProduct: (data: object) => api.post('/user/saved-products', data),
  deleteSavedProduct: (id: string) => api.delete(`/user/saved-products/${id}`),
  linkTelegram: (code: string) => api.post('/user/telegram/link', { code }),
};

export const publicApi = {
  getStats: () => api.get('/public/stats'),
  getMerchants: () => api.get('/public/merchants'),
  getBlogs: (params?: object) => api.get('/public/blogs', { params }),
  getBlog: (slug: string) => api.get(`/public/blogs/${slug}`),
  getFaqs: () => api.get('/public/faqs'),
  getBanners: (position?: string) =>
    api.get(`/public/banners${position ? `?position=${position}` : ''}`),
};

export const adminApi = {
  getDashboardStats: () => api.get('/admin/stats'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: object) => api.patch(`/admin/users/${id}`, data),
  banUser: (id: string) => api.post(`/admin/users/${id}/ban`),
  getOrders: (params?: object) => api.get('/admin/orders', { params }),
  approveWithdraw: (id: string) => api.post(`/admin/withdrawals/${id}/approve`),
  rejectWithdraw: (id: string, reason: string) =>
    api.post(`/admin/withdrawals/${id}/reject`, { reason }),
  getWithdrawals: (params?: object) => api.get('/admin/withdrawals', { params }),
  createGiftcode: (data: object) => api.post('/admin/giftcodes', data),
  getGiftcodes: (params?: object) => api.get('/admin/giftcodes', { params }),
  getMerchants: () => api.get('/admin/merchants'),
  updateMerchant: (id: number, data: object) => api.patch(`/admin/merchants/${id}`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: string) =>
    api.patch(`/admin/settings/${key}`, { value }),
};
