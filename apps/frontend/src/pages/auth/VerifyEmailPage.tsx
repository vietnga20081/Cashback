import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-green">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900">GreenCash</div>
        </Link>

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {verified ? 'Email đã được xác thực!' : 'Vui lòng xác thực email'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {verified ? 'Bạn có thể đăng nhập ngay bây giờ.' : 'Kiểm tra hộp thư của bạn để xác thực tài khoản.'}
          </p>
          <Link to="/login" className="inline-block w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition">
            Đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
