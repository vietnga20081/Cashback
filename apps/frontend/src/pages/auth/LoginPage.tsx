import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Lock, Mail } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';
import { TwoFAModal } from '../../components/auth/TwoFAModal';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{ tempToken: string } | null>(null);

  const redirect = searchParams.get('redirect') || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const result = res.data.data;

      if (result.requires2FA) {
        setTwoFAData({ tempToken: result.tempToken });
        return;
      }

      setAuth(result.user, result.accessToken);
      toast.success('Đăng nhập thành công!');
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handle2FASuccess(accessToken: string, user: any) {
    setAuth(user, accessToken);
    toast.success('Đăng nhập thành công!');
    navigate(redirect, { replace: true });
    setTwoFAData(null);
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-green">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-gray-900">GreenCash</div>
                <div className="text-xs text-gray-400 -mt-0.5">Cashback Platform</div>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
            <p className="text-gray-500 text-sm mt-1">Chào mừng bạn trở lại!</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-hover font-medium">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-green"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Đăng nhập <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary hover:text-primary-hover font-semibold">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {twoFAData && (
        <TwoFAModal
          tempToken={twoFAData.tempToken}
          onSuccess={handle2FASuccess}
          onClose={() => setTwoFAData(null)}
        />
      )}
    </>
  );
}
