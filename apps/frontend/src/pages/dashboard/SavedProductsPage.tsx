import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Trash2 } from 'lucide-react';
import { userApi } from '../../services/api';
import toast from 'react-hot-toast';

export function SavedProductsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['saved-products'],
    queryFn: () => userApi.getSavedProducts().then(r => r.data.data),
  });

  async function handleDelete(id: string) {
    try {
      await userApi.deleteSavedProduct(id);
      toast.success('Đã xóa sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['saved-products'] });
    } catch {
      toast.error('Không thể xóa');
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm đã lưu</h1>
        <p className="text-gray-500 text-sm mt-1">Danh sách sản phẩm bạn muốn mua</p>
      </div>

      {!data?.products?.length ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Chưa có sản phẩm đã lưu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.products.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-50 group"
            >
              <div className="aspect-square bg-gray-100 relative">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{p.name}</div>
                {p.price && <div className="text-sm font-bold text-gray-900">{Number(p.price).toLocaleString('vi-VN')}đ</div>}
                {p.cashback && <div className="text-xs text-primary font-medium">Cashback: {Number(p.cashback).toLocaleString('vi-VN')}đ</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
