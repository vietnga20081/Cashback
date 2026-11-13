import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Send, Clock, Filter } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { walletApi } from '../../services/api';
import { cn } from '../../lib/utils';

const typeConfig: Record<string, { label: string; color: string; bg: string; sign: string }> = {
  CASHBACK_RECEIVED: { label: 'Cashback', color: 'text-primary', bg: 'bg-primary-50', sign: '+' },
  WITHDRAWAL: { label: 'Rút tiền', color: 'text-red-500', bg: 'bg-red-50', sign: '-' },
  REFERRAL_COMMISSION: { label: 'Hoa hồng', color: 'text-blue-500', bg: 'bg-blue-50', sign: '+' },
  GIFTCODE_BONUS: { label: 'Giftcode', color: 'text-amber-500', bg: 'bg-amber-50', sign: '+' },
  ADJUSTMENT: { label: 'Điều chỉnh', color: 'text-gray-500', bg: 'bg-gray-50', sign: '' },
};

export function WalletPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [txFilter, setTxFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet().then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['wallet-stats', period],
    queryFn: () => walletApi.getStats(period).then(r => r.data.data),
  });

  const { data: txData } = useQuery({
    queryKey: ['wallet-transactions', txFilter, page],
    queryFn: () => walletApi.getTransactions({ type: txFilter || undefined, page, limit: 15 }).then(r => r.data.data),
  });

  const balanceCards = [
    {
      label: 'Số dư khả dụng',
      value: Number(wallet?.availableBalance || 0),
      icon: Wallet,
      color: 'from-primary to-primary-700',
      textColor: 'text-white',
    },
    {
      label: 'Đang chờ xác nhận',
      value: Number(wallet?.pendingBalance || 0),
      icon: Clock,
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-white',
    },
    {
      label: 'Tổng cashback nhận',
      value: Number(wallet?.totalEarned || 0),
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-white',
    },
    {
      label: 'Tổng đã rút',
      value: Number(wallet?.totalWithdrawn || 0),
      icon: ArrowUpRight,
      color: 'from-gray-600 to-gray-800',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ví tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý số dư và giao dịch</p>
        </div>
        <Link
          to="/dashboard/withdraw"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition shadow-green"
        >
          <Send className="w-4 h-4" />
          Rút tiền
        </Link>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balanceCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('bg-gradient-to-br rounded-2xl p-5', card.color)}
          >
            <card.icon className={cn('w-5 h-5 mb-3 opacity-90', card.textColor)} />
            <div className={cn('text-2xl font-bold mb-1', card.textColor)}>
              {card.value.toLocaleString('vi-VN')}đ
            </div>
            <div className={cn('text-xs opacity-80', card.textColor)}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">Biểu đồ thu nhập</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                )}
              >
                {p === 'week' ? '7 ngày' : p === 'month' ? '30 ngày' : '1 năm'}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats?.chart || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: any) => [`${Number(v).toLocaleString('vi-VN')}đ`, 'Cashback']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="cashback" stroke="#16A34A" strokeWidth={2} fill="url(#walletGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Lịch sử giao dịch</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={txFilter}
              onChange={(e) => { setTxFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tất cả</option>
              <option value="CASHBACK_RECEIVED">Cashback</option>
              <option value="WITHDRAWAL">Rút tiền</option>
              <option value="REFERRAL_COMMISSION">Hoa hồng</option>
              <option value="GIFTCODE_BONUS">Giftcode</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {txData?.transactions?.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Chưa có giao dịch nào</p>
            </div>
          ) : (
            txData?.transactions?.map((tx: any) => {
              const cfg = typeConfig[tx.type] || { label: tx.type, color: 'text-gray-600', bg: 'bg-gray-50', sign: '' };
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
                    {isPositive
                      ? <ArrowDownLeft className={cn('w-5 h-5', cfg.color)} />
                      : <ArrowUpRight className="w-5 h-5 text-red-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{cfg.label}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </div>
                    {tx.description && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{tx.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={cn('text-sm font-bold', isPositive ? 'text-primary' : 'text-red-500')}>
                      {isPositive ? '+' : ''}{Number(tx.amount).toLocaleString('vi-VN')}đ
                    </div>
                    <div className="text-xs text-gray-400">
                      Số dư: {Number(tx.balanceAfter).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {txData?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-50">
            <span className="text-sm text-gray-500">
              Trang {page} / {txData.pagination.pages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Trước
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= txData.pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Sau
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
