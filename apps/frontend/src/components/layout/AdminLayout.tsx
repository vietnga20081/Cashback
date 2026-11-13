import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingBag, Wallet, Store,
  Gift, FileText, Image, Settings, LogOut, Menu, X,
  Zap, ChevronRight, BarChart2, Bell
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/withdrawals', label: 'Rút tiền', icon: Wallet },
  { to: '/admin/merchants', label: 'Merchant', icon: Store },
  { to: '/admin/giftcodes', label: 'Giftcode', icon: Gift },
  { to: '/admin/cms', label: 'Trang CMS', icon: FileText },
  { to: '/admin/blogs', label: 'Blog', icon: BarChart2 },
  { to: '/admin/banners', label: 'Banner', icon: Image },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Đã đăng xuất');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm" />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-60 bg-gray-900 z-40 flex flex-col transition-transform duration-300',
        'lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">GreenCash</div>
              <div className="text-xs text-gray-500">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300')} />
                  <span className="flex-1">{item.label}</span>
                  {!isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold flex items-center justify-center">
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition group">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <button className="p-2 rounded-xl text-gray-600 hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
              <NavLink to="/dashboard" className="text-sm text-gray-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-primary-50 transition">
                ← Về Dashboard
              </NavLink>
            </div>
          </div>
        </header>

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
