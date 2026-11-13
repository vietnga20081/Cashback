import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Dashboard Pages
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { WalletPage } from './pages/dashboard/WalletPage';
import { CashbackPage } from './pages/dashboard/CashbackPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { SavedProductsPage } from './pages/dashboard/SavedProductsPage';
import { WithdrawPage } from './pages/dashboard/WithdrawPage';
import { WithdrawHistoryPage } from './pages/dashboard/WithdrawHistoryPage';
import { ReferralPage } from './pages/dashboard/ReferralPage';
import { GiftcodePage } from './pages/dashboard/GiftcodePage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { SecurityPage } from './pages/dashboard/SecurityPage';
import { ActivityLogPage } from './pages/dashboard/ActivityLogPage';
import { TelegramPage } from './pages/dashboard/TelegramPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminWithdrawPage } from './pages/admin/AdminWithdrawPage';
import { AdminMerchantsPage } from './pages/admin/AdminMerchantsPage';
import { AdminGiftcodesPage } from './pages/admin/AdminGiftcodesPage';
import { AdminCmsPage } from './pages/admin/AdminCmsPage';
import { AdminBlogsPage } from './pages/admin/AdminBlogsPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Guards
import { AuthGuard } from './components/shared/AuthGuard';
import { AdminGuard } from './components/shared/AdminGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  // Public
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },

  // Auth
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },

  // Dashboard (authenticated)
  {
    element: <AuthGuard><DashboardLayout /></AuthGuard>,
    children: [
      { path: '/dashboard', element: <DashboardHome /> },
      { path: '/dashboard/wallet', element: <WalletPage /> },
      { path: '/dashboard/cashback', element: <CashbackPage /> },
      { path: '/dashboard/orders', element: <OrdersPage /> },
      { path: '/dashboard/saved', element: <SavedProductsPage /> },
      { path: '/dashboard/withdraw', element: <WithdrawPage /> },
      { path: '/dashboard/withdraw/history', element: <WithdrawHistoryPage /> },
      { path: '/dashboard/referral', element: <ReferralPage /> },
      { path: '/dashboard/giftcode', element: <GiftcodePage /> },
      { path: '/dashboard/notifications', element: <NotificationsPage /> },
      { path: '/dashboard/profile', element: <ProfilePage /> },
      { path: '/dashboard/security', element: <SecurityPage /> },
      { path: '/dashboard/activity', element: <ActivityLogPage /> },
      { path: '/dashboard/telegram', element: <TelegramPage /> },
    ],
  },

  // Admin
  {
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/users', element: <AdminUsersPage /> },
      { path: '/admin/orders', element: <AdminOrdersPage /> },
      { path: '/admin/withdrawals', element: <AdminWithdrawPage /> },
      { path: '/admin/merchants', element: <AdminMerchantsPage /> },
      { path: '/admin/giftcodes', element: <AdminGiftcodesPage /> },
      { path: '/admin/cms', element: <AdminCmsPage /> },
      { path: '/admin/blogs', element: <AdminBlogsPage /> },
      { path: '/admin/banners', element: <AdminBannersPage /> },
      { path: '/admin/settings', element: <AdminSettingsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#1F2937',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#16A34A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
