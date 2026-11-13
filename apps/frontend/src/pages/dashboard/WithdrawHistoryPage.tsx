import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { walletApi } from '../../services/api';
import { cn } from '../../lib/utils';

const statusConfig: Record<string, any> = {
  PENDING: { label: 'Chờ duyệt', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  PROCESSING: { label: 'Đang xử lý', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  COMPLETED: { label: 'Hoàn thành', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary-50' },
  FAILED: { label: 'Thất bại', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  REJECTED: { label: 'Từ chối', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

export function WithdrawHistoryPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['withdraw-history', page],
    queryFn: () => walletApi.getWithdrawals({ page, limit: 15 }).then(r => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử rút tiền</h1>
        <p className="text-gray-500 text-sm mt-1">Theo dõi các yêu cầu rút tiền của bạn</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        {!data?.withdrawals?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">Chưa có yêu cầu rút tiền nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.withdrawals.map((wd: any) => {
              const cfg = statusConfig[wd.status];
              return (
                <div key={wd.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
                    <cfg.icon className={cn('w-5 h-5', cfg.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{wd.account?.accountName}</div>
                    <div className="text-xs text-gray-400">{wd.method} • {new Date(wd.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{Number(wd.amount).toLocaleString('vi-VN')}đ</div>
                    <div className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-50">
            <span className="text-sm text-gray-500">Trang {page} / {data.pagination.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Trước</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
