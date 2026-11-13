import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users, ShoppingBag, Wallet, TrendingUp, ArrowUpRight,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminApi } from '../../services/api';
import { cn } from '../../lib/utils';

const COLORS = ['#16A34A', '#22C55E', '#86EFAC', '#BBF7D0'];

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats().then(r => r.data.data),
  });

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: stats?.newUsersToday || 0,
      changeLabel: 'mới hôm nay',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Tổng đơn hàng',
      value: stats?.totalOrders?.toLocaleString() || '0',
      change: stats?.ordersToday || 0,
      changeLabel: 'hôm nay',
      icon: ShoppingBag,
      color: 'bg-primary',
    },
    {
      label: 'Tổng cashback',
      value: `${Number(stats?.totalCashback || 0).toLocaleString('vi-VN')}đ`,
      change: null,
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      label: 'Chờ duyệt rút',
      value: stats?.pendingWithdrawals || 0,
      change: null,
      icon: Wallet,
      color: 'bg-red-500',
    },
  ];

  const withdrawStatusData = [
    { name: 'Đã duyệt', value: stats?.withdrawStats?.completed || 0 },
    { name: 'Đang chờ', value: stats?.withdrawStats?.pending || 0 },
    { name: 'Từ chối', value: stats?.withdrawStats?.rejected || 0 },
    { name: 'Đang xử lý', value: stats?.withdrawStats?.processing || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-card border border-gray-50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.color)}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              {card.change !== null && (
                <span className="flex items-center gap-1 text-xs text-primary bg-primary-50 px-2 py-0.5 rounded-lg font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  +{card.change} {card.changeLabel}
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-gray-50"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-5">Doanh thu theo ngày (30 ngày)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.revenueChart || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toLocaleString('vi-VN')}đ`]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
              />
              <Bar dataKey="cashback" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Withdrawal pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-5">Trạng thái rút tiền</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={withdrawStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={4} dataKey="value">
                {withdrawStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [v, '']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent withdrawals */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Yêu cầu rút tiền gần đây</h3>
          <a href="/admin/withdrawals" className="text-sm text-primary font-medium hover:text-primary-hover">
            Xem tất cả →
          </a>
        </div>

        <div className="divide-y divide-gray-50">
          {stats?.recentWithdrawals?.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Không có yêu cầu nào</div>
          ) : (
            stats?.recentWithdrawals?.slice(0, 5).map((wd: any) => {
              const statusConfig: Record<string, any> = {
                PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Chờ duyệt' },
                PROCESSING: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Đang xử lý' },
                COMPLETED: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary-50', label: 'Hoàn thành' },
                REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Từ chối' },
              };
              const sc = statusConfig[wd.status] || statusConfig.PENDING;

              return (
                <div key={wd.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', sc.bg)}>
                    <sc.icon className={cn('w-4 h-4', sc.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{wd.user?.fullName}</div>
                    <div className="text-xs text-gray-400">{wd.method} • {new Date(wd.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{Number(wd.amount).toLocaleString('vi-VN')}đ</div>
                    <div className={cn('text-xs font-medium', sc.color)}>{sc.label}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
