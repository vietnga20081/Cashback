import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';

export function OrdersPage() {
  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/cashback/history?limit=50').then(r => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
        <p className="text-gray-500 text-sm mt-1">Theo dõi đơn hàng đã mua qua GreenCash</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 p-6"
      >
        {!data?.cashbacks?.length ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">Chưa có đơn hàng nào</p>
            <p className="text-xs text-gray-400 mt-1">Tạo link cashback và mua hàng để bắt đầu</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.cashbacks.map((cb: any) => (
              <div key={cb.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{cb.merchant?.name}</div>
                  <div className="text-xs text-gray-400">#{cb.order?.externalOrderId || cb.orderId.slice(0, 8)}</div>
                </div>
                <div className="text-sm font-bold text-primary">+{Number(cb.amount).toLocaleString('vi-VN')}đ</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
