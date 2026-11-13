import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Shield, Lock, Smartphone } from 'lucide-react';
import { userApi, authApi } from '../../services/api';
import toast from 'react-hot-toast';

export function SecurityPage() {
  const [loading, setLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');

  const { register, handleSubmit, reset } = useForm();

  async function onChangePassword(data: any) {
    setLoading(true);
    try {
      await userApi.changePassword(data);
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup2FA() {
    try {
      const res = await authApi.setup2FA();
      setQrCode(res.data.data.qrCode);
      setShow2FASetup(true);
    } catch {
      toast.error('Không thể thiết lập 2FA');
    }
  }

  async function handleEnable2FA() {
    try {
      await authApi.enable2FA(twoFAToken);
      toast.success('2FA đã được kích hoạt!');
      setShow2FASetup(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã không đúng');
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảo mật</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý mật khẩu và xác thực 2 lớp</p>
      </div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Đổi mật khẩu</h3>
        </div>

        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
          <input {...register('currentPassword')} type="password" placeholder="Mật khẩu hiện tại"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <input {...register('newPassword')} type="password" placeholder="Mật khẩu mới"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition disabled:opacity-60">
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </motion.div>

      {/* 2FA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Xác thực 2 lớp (2FA)</h3>
            <p className="text-xs text-gray-500">Bảo vệ tài khoản với Google Authenticator</p>
          </div>
        </div>

        {!show2FASetup ? (
          <button onClick={handleSetup2FA}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Kích hoạt 2FA
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />}
            </div>
            <p className="text-xs text-gray-500 text-center">Quét mã QR bằng Google Authenticator, sau đó nhập mã 6 số</p>
            <input
              value={twoFAToken}
              onChange={(e) => setTwoFAToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={handleEnable2FA}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition">
              Xác nhận kích hoạt
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
