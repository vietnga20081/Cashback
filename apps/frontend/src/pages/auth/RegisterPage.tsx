import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, User, Mail, Lock, Gift } from 'lucide-react';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { OtpModal } from '../../components/auth/OtpModal';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Phải có ít nhất 1 số'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  agree: z.boolean().refine(v => v, 'Vui lòng đồng ý điều khoản'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  const defaultRef = searchParams.get('ref') || '';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { referralCode: defaultRef },
  });

  const password = watch('password', '');

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        referralCode: data.referralCode || undefined,
      });
      setOtpEmail(data.email);
      toast.success('Đăng ký thành công! Vui lòng xác thực email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
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
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
            <p className="text-gray-500 text-sm mt-1">Miễn phí — không cần thẻ tín dụng</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('fullName')} placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('email')} type="email" placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength */}
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength
                        ? strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-yellow-400' : 'bg-primary'
                        : 'bg-gray-200'}`} />
                    ))}
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('confirmPassword')} type="password" placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* Referral code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã giới thiệu <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('referralCode')} placeholder="ABCD1234"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition uppercase" />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input {...register('agree')} type="checkbox" className="mt-0.5 w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-gray-600">
                  Tôi đồng ý với{' '}
                  <a href="/terms" className="text-primary hover:underline">Điều khoản sử dụng</a>
                  {' '}và{' '}
                  <a href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</a>
                </span>
              </label>
              {errors.agree && <p className="text-red-500 text-xs">{errors.agree.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-green mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Tạo tài khoản <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary hover:text-primary-hover font-semibold">Đăng nhập</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {otpEmail && (
        <OtpModal
          email={otpEmail}
          type="VERIFY"
          title="Xác thực email"
          description={`Nhập mã OTP đã được gửi đến ${otpEmail}`}
          onSuccess={() => navigate('/login?verified=1')}
          onClose={() => setOtpEmail('')}
        />
      )}
    </>
  );
}
