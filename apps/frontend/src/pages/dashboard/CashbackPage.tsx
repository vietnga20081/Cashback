import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter, Package } from 'lucide-react';
import { cashbackApi } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Đang chờ', color: 'text-amber-600', bg: 'bg-amber-50' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-600', bg: 'bg-blue-50' },
  PAID: { label: 'Đã thanh toán', color: 'text-primary', bg: 'bg-primary-50' },
  CANCELLED: { label: 'Đã hủy', color: 'text-gray-500', bg: 'bg-gray-50' },
  REJECTED: { label: 'Bị từ chối', color: 'text-red-500', bg: 'bg-red-50' },
};

export function CashbackPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['cashback-history', status, page],
    queryFn: () => cashbackApi.getHistory({ status: status || undefined, page, limit: 15 }).then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['cashback-stats'],
    queryFn: () => cashbackApi.getStats().then(r => r.data.data),
  });

  async function handleExport() {
    try {
      const res = await cashbackApi.exportExcel({ status: status || undefined });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cashback-history.xlsx';
      a.click();
      toast.success('Đã xuất file Excel!');
    } catch {
      toast.error('Không thể xuất file');
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử hoàn tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi trạng thái cashback của bạn</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Đang chờ', value: stats?.pending?.amount, count: stats?.pending?.count, color: 'bg-amber-500' },
          { label: 'Đã xác nhận', value: stats?.confirmed?.amount, count: stats?.confirmed?.count, color: 'bg-blue-500' },
          { label: 'Đã thanh toán', value: stats?.paid?.amount, count: stats?.paid?.count, color: 'bg-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card border border-gray-50">
            <div className={cn('w-2 h-2 rounded-full mb-2', s.color)} />
            <div className="text-lg font-bold text-gray-900">{Number(s.value || 0).toLocaleString('vi-VN')}đ</div>
            <div className="text-xs text-gray-500">{s.label} • {s.count || 0} đơn</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        {data?.cashbacks?.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">Chưa có dữ liệu cashback</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.cashbacks?.map((cb: any) => {
              const cfg = statusConfig[cb.status];
              return (
                <div key={cb.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{cb.merchant?.name}</div>
                    <div className="text-xs text-gray-400">
                      Đơn hàng #{cb.order?.externalOrderId || cb.orderId.slice(0, 8)} • {new Date(cb.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span className={cn('text-xs font-medium px-2.5 py-1 rounded-lg', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                  <div className="text-sm font-bold text-gray-900 w-28 text-right">
                    {Number(cb.amount).toLocaleString('vi-VN')}đ
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
