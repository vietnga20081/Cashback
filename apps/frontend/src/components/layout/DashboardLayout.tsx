import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, History, ShoppingBag, Bookmark,
  Send, Clock, Gift, Bell, Users, Settings, LogOut, Menu, X,
  ChevronRight, Bot, Shield, FileText, Zap, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useProfile } from '../../hooks/useProfile';

const navItems = [
  {
    group: 'Chính',
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
      { to: '/dashboard/wallet', label: 'Ví tiền', icon: Wallet },
      { to: '/dashboard/cashback', label: 'Lịch sử hoàn tiền', icon: History },
      { to: '/dashboard/orders', label: 'Đơn hàng', icon: ShoppingBag },
      { to: '/dashboard/saved', label: 'Sản phẩm đã lưu', icon: Bookmark },
    ],
  },
  {
    group: 'Rút tiền',
    items: [
      { to: '/dashboard/withdraw', label: 'Yêu cầu rút tiền', icon: Send },
      { to: '/dashboard/withdraw/history', label: 'Lịch sử rút', icon: Clock },
    ],
  },
  {
    group: 'Khác',
    items: [
      { to: '/dashboard/referral', label: 'Giới thiệu bạn bè', icon: Users },
      { to: '/dashboard/giftcode', label: 'Nhập Giftcode', icon: Gift },
      { to: '/dashboard/notifications', label: 'Thông báo', icon: Bell, badge: true },
      { to: '/dashboard/telegram', label: 'Kết nối Telegram', icon: Bot },
    ],
  },
  {
    group: 'Tài khoản',
    items: [
      { to: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: Settings },
      { to: '/dashboard/security', label: 'Bảo mật', icon: Shield },
      { to: '/dashboard/activity', label: 'Nhật ký hoạt động', icon: FileText },
    ],
  },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationApi.getUnreadCount().then(r => r.data.data?.count || 0),
    refetchInterval: 30000,
  });

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    logout();
    navigate('/login');
    toast.success('Đã đăng xuất');
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-green">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">GreenCash</div>
              <div className="text-xs text-gray-400 -mt-0.5">Cashback Platform</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3 bg-primary-50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {navItems.map((group) => (
            <div key={group.group}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={(item as any).exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {(item as any).badge && (unreadCount ?? 0) > 0 && (
                          <span className={cn(
                            'text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center',
                            isActive ? 'bg-white/20 text-white' : 'bg-primary text-white'
                          )}>
                            {unreadCount}
                          </span>
                        )}
                        {!(item as any).badge && <ChevronRight className={cn('w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity', isActive && 'opacity-0')} />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/dashboard/notifications"
            className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
          >
            <Bell className="w-5 h-5" />
          </NavLink>
          <NavLink
            to="/dashboard/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.fullName}</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useProfile(); // sync referralCode and avatar from API into store

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
