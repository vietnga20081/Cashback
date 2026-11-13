import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [edited, setEdited] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings().then(r => r.data.data),
  });

  const grouped = (data || []).reduce((acc: any, s: any) => {
    acc[s.group] = acc[s.group] || [];
    acc[s.group].push(s);
    return acc;
  }, {});

  async function handleSave(key: string) {
    const value = edited[key];
    if (value === undefined) return;
    try {
      await adminApi.updateSetting(key, value);
      toast.success('Đã lưu cài đặt');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch {
      toast.error('Không thể lưu');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình các thông số chung của nền tảng</p>
      </div>

      {Object.entries(grouped).map(([group, settings]: [string, any]) => (
        <div key={group} className="bg-white rounded-2xl p-6 shadow-card border border-gray-50">
          <h3 className="text-base font-semibold text-gray-900 mb-4 capitalize">{group}</h3>
          <div className="space-y-3">
            {settings.map((s: any) => (
              <div key={s.key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">{s.label || s.key}</label>
                </div>
                <input
                  defaultValue={s.value}
                  onChange={(e) => setEdited({ ...edited, [s.key]: e.target.value })}
                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => handleSave(s.key)}
                  className="p-2 bg-primary-50 text-primary rounded-lg hover:bg-primary-100 transition"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
