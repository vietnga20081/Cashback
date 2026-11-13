import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

export function AdminGiftcodesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', type: 'CASHBACK_BONUS', value: '', usageLimit: '' });
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-giftcodes'],
    queryFn: () => adminApi.getGiftcodes().then(r => r.data.data),
  });

  async function handleCreate() {
    try {
      await adminApi.createGiftcode({
        ...form,
        value: Number(form.value),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      });
      toast.success('Tạo giftcode thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-giftcodes'] });
      setShowModal(false);
      setForm({ code: '', description: '', type: 'CASHBACK_BONUS', value: '', usageLimit: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giftcode</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.giftcodes?.length || 0} mã</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition">
          <Plus className="w-4 h-4" /> Tạo Giftcode
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-6 py-3">Mã</th>
              <th className="text-left px-6 py-3">Loại</th>
              <th className="text-left px-6 py-3">Giá trị</th>
              <th className="text-left px-6 py-3">Đã dùng</th>
              <th className="text-left px-6 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.giftcodes?.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-mono font-bold">{g.code}</td>
                <td className="px-6 py-4">{g.type}</td>
                <td className="px-6 py-4">{Number(g.value).toLocaleString('vi-VN')}{g.type === 'PERCENT' ? '%' : 'đ'}</td>
                <td className="px-6 py-4">{g.usageCount} / {g.usageLimit || '∞'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${g.isActive ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    {g.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Tạo Giftcode mới</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Mã code (VD: WELCOME2024)" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Mô tả" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                <option value="CASHBACK_BONUS">Cashback Bonus (VND)</option>
                <option value="FIXED">Fixed Amount (VND)</option>
                <option value="PERCENT">Percent (%)</option>
              </select>
              <input type="number" placeholder="Giá trị" value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
              <input type="number" placeholder="Giới hạn lượt dùng (để trống = không giới hạn)" value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <button onClick={handleCreate} className="w-full mt-5 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition">
              Tạo Giftcode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
