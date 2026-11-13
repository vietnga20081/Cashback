import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Save } from 'lucide-react';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: { fullName: user?.fullName || '', phone: '' },
  });

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await userApi.updateProfile(data);
      updateUser({ fullName: data.fullName });
      toast.success('Cập nhật thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý thông tin tài khoản</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-xl font-bold">
            {user?.fullName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.fullName}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input {...register('fullName')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={user?.email} disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input {...register('phone')} placeholder="0901234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
