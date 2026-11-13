import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { BarChart2 } from 'lucide-react';

export function AdminBlogsPage() {
  const { data } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => api.get('/admin/blogs').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Blog</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} bài viết</p>
      </div>

      {!data?.blogs?.length ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BarChart2 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-6 py-3">Tiêu đề</th>
                <th className="text-left px-6 py-3">Danh mục</th>
                <th className="text-left px-6 py-3">Lượt xem</th>
                <th className="text-left px-6 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.blogs.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{b.title}</td>
                  <td className="px-6 py-4 text-gray-500">{b.category || '-'}</td>
                  <td className="px-6 py-4">{b.views}</td>
                  <td className="px-6 py-4">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
