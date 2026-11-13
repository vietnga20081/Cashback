import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, ShoppingBag, ArrowUpRight,
  Copy, Check, Link2, Zap, ArrowRight, BadgeCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { walletApi, affiliateApi, cashbackApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, subValue, icon: Icon, trend, color, delay = 0
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  trend?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-card border border-gray-50 hover:shadow-card-hover transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subValue && <div className="text-xs text-gray-400 mt-0.5">{subValue}</div>}
    </motion.div>
  );
}

// ─── Cashback Link Creator ─────────────────────────────────────────────────────

function LinkCreator() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const platforms = [
    { name: 'Shopee', icon: '🛒', pattern: 'shopee' },
    { name: 'TikTok', icon: '🎵', pattern: 'tiktok' },
    { name: 'Lazada', icon: '📦', pattern: 'lazada' },
  ];

  const detected = platforms.find(p => url.toLowerCase().includes(p.pattern));

  async function handleCreate() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await affiliateApi.createLink(url);
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo link. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép link!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
          <Link2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tạo Link Cashback</h3>
          <p className="text-xs text-gray-500">Dán link sản phẩm để nhận cashback</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://shopee.vn/product..."
            className="w-full px-4 py-3 pr-24 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {detected && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-lg font-medium">
                {detected.icon} {detected.name}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !url.trim()}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {loading ? 'Đang tạo link...' : 'Tạo Link Cashback'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Link cashback đã sẵn sàng!</span>
          </div>

          {result.estimatedCashback && (
            <div className="text-xs text-gray-600 mb-3">
              💰 Cashback dự kiến:{' '}
              <span className="font-bold text-primary">
                +{Number(result.estimatedCashback).toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              readOnly
              value={result.trackingUrl}
              className="flex-1 px-3 py-2 bg-white border border-primary-200 rounded-lg text-xs font-mono text-gray-600 focus:outline-none"
            />
            <button
              onClick={() => handleCopy(result.trackingUrl)}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => { setUrl(''); setResult(null); }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Tạo link khác
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Recent Transactions ───────────────────────────────────────────────────────

function RecentTransactions({ transactions }: { transactions: any[] }) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    CASHBACK_RECEIVED: { label: 'Cashback', color: 'text-primary' },
    WITHDRAWAL: { label: 'Rút tiền', color: 'text-red-500' },
    REFERRAL_COMMISSION: { label: 'Hoa hồng', color: 'text-blue-500' },
    GIFTCODE_BONUS: { label: 'Giftcode', color: 'text-amber-500' },
  };

  if (!transactions?.length) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Wallet className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">Chưa có giao dịch nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const config = typeConfig[tx.type] || { label: tx.type, color: 'text-gray-600' };
        const isPositive = tx.amount > 0;

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition"
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
              isPositive ? 'bg-primary-50' : 'bg-red-50'
            )}>
              {isPositive ? '↑' : '↓'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{config.label}</div>
              <div className="text-xs text-gray-400">
                {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <div className={cn('text-sm font-semibold', isPositive ? 'text-primary' : 'text-red-500')}>
              {isPositive ? '+' : ''}{Number(tx.amount).toLocaleString('vi-VN')}đ
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function DashboardHome() {
  const { user } = useAuthStore();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet().then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['wallet-stats', chartPeriod],
    queryFn: () => walletApi.getStats(chartPeriod).then(r => r.data.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const stats = [
    {
      label: 'Số dư khả dụng',
      value: `${Number(walletData?.availableBalance || 0).toLocaleString('vi-VN')}đ`,
      subValue: `Pending: ${Number(walletData?.pendingBalance || 0).toLocaleString('vi-VN')}đ`,
      icon: Wallet,
      trend: '+12%',
      color: 'bg-primary',
      delay: 0,
    },
    {
      label: 'Tổng cashback nhận',
      value: `${Number(walletData?.totalEarned || 0).toLocaleString('vi-VN')}đ`,
      icon: TrendingUp,
      trend: '+8.5%',
      color: 'bg-blue-500',
      delay: 0.05,
    },
    {
      label: 'Tổng đã rút',
      value: `${Number(walletData?.totalWithdrawn || 0).toLocaleString('vi-VN')}đ`,
      icon: ArrowUpRight,
      color: 'bg-amber-500',
      delay: 0.1,
    },
    {
      label: 'Đơn hàng',
      value: '0',
      icon: ShoppingBag,
      color: 'bg-purple-500',
      delay: 0.15,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          {greeting()}, {user?.fullName?.split(' ').pop()} 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-sm mt-1"
        >
          Đây là tổng quan tài khoản của bạn
        </motion.p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-gray-50"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Biểu đồ cashback</h3>
              <p className="text-xs text-gray-500 mt-0.5">Thu nhập theo thời gian</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    chartPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {p === 'week' ? '7 ngày' : p === 'month' ? '30 ngày' : '1 năm'}
                </button>
              ))}
            </div>
          </div>

          {statsData?.chart?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={statsData.chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashbackGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: any) => [`${Number(v).toLocaleString('vi-VN')}đ`, 'Cashback']}
                  labelFormatter={(l) => new Date(l).toLocaleDateString('vi-VN')}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cashback"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#cashbackGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </motion.div>

        {/* Link Creator */}
        <LinkCreator />
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Giao dịch gần đây</h3>
          <Link
            to="/dashboard/wallet"
            className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <RecentTransactions transactions={walletData?.transactions || []} />
      </motion.div>
    </div>
  );
}
