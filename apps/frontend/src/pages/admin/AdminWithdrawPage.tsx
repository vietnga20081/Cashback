import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-500 bg-amber-50',
  PROCESSING: 'text-blue-500 bg-blue-50',
  COMPLETED: 'text-primary bg-primary-50',
  REJECTED: 'text-red-500 bg-red-50',
  FAILED: 'text-red-500 bg-red-50',
};

export function AdminWithdrawPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-withdrawals', status, page],
    queryFn: () => adminApi.getWithdrawals({ status: status || undefined, page, limit: 20 }).then(r => r.data.data),
  });

  async function handleApprove(id: string) {
    try {
      await adminApi.approveWithdraw(id);
      toast.success('Đã duyệt yêu cầu rút tiền');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể duyệt');
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Lý do từ chối:');
    if (reason === null) return;
    try {
      await adminApi.rejectWithdraw(id, reason);
      toast.success('Đã từ chối yêu cầu');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể từ chối');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt rút tiền</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} yêu cầu</p>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', ''].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition',
              status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-6 py-3">Người dùng</th>
              <th className="text-left px-6 py-3">Phương thức</th>
              <th className="text-left px-6 py-3">Số tiền</th>
              <th className="text-left px-6 py-3">Trạng thái</th>
              <th className="text-left px-6 py-3">Ngày</th>
              <th className="text-right px-6 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.withdrawals?.map((wd: any) => (
              <tr key={wd.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{wd.user?.fullName}</div>
                  <div className="text-xs text-gray-400">{wd.account?.accountName} • {wd.account?.accountNo}</div>
                </td>
                <td className="px-6 py-4">{wd.method}</td>
                <td className="px-6 py-4 font-bold">{Number(wd.amount).toLocaleString('vi-VN')}đ</td>
                <td className="px-6 py-4">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', statusColors[wd.status])}>{wd.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(wd.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4 text-right">
                  {(wd.status === 'PENDING' || wd.status === 'PROCESSING') && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleApprove(wd.id)} className="p-1.5 bg-primary-50 text-primary rounded-lg hover:bg-primary-100">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(wd.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
