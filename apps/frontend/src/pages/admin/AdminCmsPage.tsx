import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api } from '../../services/api';

export function AdminCmsPage() {
  const { data } = useQuery({
    queryKey: ['admin-cms'],
    queryFn: () => api.get('/admin/cms').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trang CMS</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý trang nội dung tĩnh (Giới thiệu, Điều khoản, Chính sách...)</p>
      </div>

      {!data?.length ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Chưa có trang CMS nào được tạo</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-6 py-3">Tiêu đề</th>
                <th className="text-left px-6 py-3">Slug</th>
                <th className="text-left px-6 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{p.title}</td>
                  <td className="px-6 py-4 text-gray-500">/{p.slug}</td>
                  <td className="px-6 py-4">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
