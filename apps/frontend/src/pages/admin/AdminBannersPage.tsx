import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Image } from 'lucide-react';

export function AdminBannersPage() {
  const { data } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/admin/banners').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Banner</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.length || 0} banner</p>
      </div>

      {!data?.length ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Image className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Chưa có banner nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((b: any) => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-50">
              <div className="aspect-video bg-gray-100">
                {b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-800">{b.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{b.position}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
