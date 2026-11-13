import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const email = searchParams.get('email') || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      toast.success('Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-green">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl font-bold text-gray-900">GreenCash</div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Nhập mã OTP và mật khẩu mới</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Mã OTP (6 số)" maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20" />

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password"
                placeholder="Mật khẩu mới"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? 'Đang xử lý...' : <>Đặt lại mật khẩu <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
