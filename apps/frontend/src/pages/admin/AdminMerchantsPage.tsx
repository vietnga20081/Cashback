import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

export function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ userCommission: '', isActive: true });

  const { data } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: () => adminApi.getMerchants().then(r => r.data.data),
  });

  function startEdit(m: any) {
    setEditing(m.id);
    setForm({ userCommission: String(m.userCommission), isActive: m.isActive });
  }

  async function handleSave(id: number) {
    try {
      await adminApi.updateMerchant(id, { userCommission: Number(form.userCommission), isActive: form.isActive });
      toast.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      setEditing(null);
    } catch {
      toast.error('Không thể cập nhật');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Merchant</h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình tỷ lệ hoa hồng cho từng sàn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data?.map((m: any) => (
          <div key={m.id} className="bg-white rounded-2xl p-5 shadow-card border border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{m.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${m.isActive ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                {m.isActive ? 'Hoạt động' : 'Tắt'}
              </span>
            </div>

            {editing === m.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">% Cashback cho user</label>
                  <input
                    type="number"
                    value={form.userCommission}
                    onChange={(e) => setForm({ ...form, userCommission: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Đang hoạt động
                </label>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(m.id)} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium">Lưu</button>
                  <button onClick={() => setEditing(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Hủy</button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary mb-1">{m.userCommission}%</div>
                <div className="text-xs text-gray-500 mb-4">Cashback cho người dùng</div>
                <button onClick={() => startEdit(m)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
