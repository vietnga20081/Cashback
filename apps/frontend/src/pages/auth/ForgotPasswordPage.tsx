import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { OtpModal } from '../../components/auth/OtpModal';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setShowOtp(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-green">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-gray-900">GreenCash</div>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
            <p className="text-gray-500 text-sm mt-1">Nhập email để nhận mã đặt lại mật khẩu</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-green">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Gửi mã OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-primary transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>

      {showOtp && (
        <OtpModal
          email={email}
          type="RESET"
          title="Đặt lại mật khẩu"
          description={`Nhập mã OTP đã gửi đến ${email}`}
          onSuccess={() => window.location.href = `/reset-password?email=${encodeURIComponent(email)}`}
          onClose={() => setShowOtp(false)}
        />
      )}
    </>
  );
}
