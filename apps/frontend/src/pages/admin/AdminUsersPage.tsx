import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Hoạt động', color: 'text-primary bg-primary-50' },
  BANNED: { label: 'Đã khóa', color: 'text-red-500 bg-red-50' },
  PENDING_VERIFY: { label: 'Chưa xác thực', color: 'text-amber-500 bg-amber-50' },
  INACTIVE: { label: 'Không hoạt động', color: 'text-gray-500 bg-gray-50' },
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminApi.getUsers({ search: search || undefined, page, limit: 20 }).then(r => r.data.data),
  });

  async function handleBan(id: string) {
    try {
      await adminApi.banUser(id);
      toast.success('Đã khóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast.error('Không thể khóa tài khoản');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} người dùng</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm theo email hoặc tên..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-6 py-3">Người dùng</th>
              <th className="text-left px-6 py-3">Số dư</th>
              <th className="text-left px-6 py-3">Trạng thái</th>
              <th className="text-left px-6 py-3">Tham gia</th>
              <th className="text-right px-6 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.users?.map((u: any) => {
              const cfg = statusConfig[u.status];
              return (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{u.fullName}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {Number(u.wallet?.availableBalance || 0).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', cfg?.color)}>{cfg?.label}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right">
                    {u.status !== 'BANNED' ? (
                      <button onClick={() => handleBan(u.id)} className="text-red-500 hover:text-red-600">
                        <Ban className="w-4 h-4 inline" />
                      </button>
                    ) : (
                      <CheckCircle className="w-4 h-4 inline text-gray-300" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

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
      </div>
    </div>
  );
}
