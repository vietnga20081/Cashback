import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { cn } from '../../lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-500 bg-amber-50',
  CONFIRMED: 'text-blue-500 bg-blue-50',
  CASHBACK_PENDING: 'text-amber-500 bg-amber-50',
  CASHBACK_APPROVED: 'text-primary bg-primary-50',
  CASHBACK_PAID: 'text-primary bg-primary-50',
  CANCELLED: 'text-gray-500 bg-gray-50',
  REJECTED: 'text-red-500 bg-red-50',
};

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => adminApi.getOrders({ page, limit: 20 }).then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} đơn hàng</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-6 py-3">Khách hàng</th>
              <th className="text-left px-6 py-3">Merchant</th>
              <th className="text-left px-6 py-3">Giá trị</th>
              <th className="text-left px-6 py-3">Cashback</th>
              <th className="text-left px-6 py-3">Trạng thái</th>
              <th className="text-left px-6 py-3">Ngày</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.orders?.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{o.user?.fullName}</div>
                  <div className="text-xs text-gray-400">{o.user?.email}</div>
                </td>
                <td className="px-6 py-4">{o.merchant?.name}</td>
                <td className="px-6 py-4">{Number(o.orderAmount).toLocaleString('vi-VN')}đ</td>
                <td className="px-6 py-4 font-medium text-primary">{Number(o.cashbackAmount).toLocaleString('vi-VN')}đ</td>
                <td className="px-6 py-4">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', statusColors[o.status])}>{o.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
