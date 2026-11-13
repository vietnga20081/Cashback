import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Shield } from 'lucide-react';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

// ─── OTP Input Component ──────────────────────────────────────────────────────

function OtpInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [values, setValues] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < 5) inputs.current[index + 1]?.focus();

    const joined = newValues.join('');
    if (joined.length === 6) onComplete(joined);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newVals = pasted.split('');
      setValues(newVals);
      onComplete(pasted);
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={1}
          className="w-11 h-12 border-2 border-gray-200 rounded-xl text-center text-lg font-bold text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
        />
      ))}
    </div>
  );
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────

interface OtpModalProps {
  email: string;
  type: 'VERIFY' | 'RESET' | 'LOGIN';
  title: string;
  description: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function OtpModal({ email, type, title, description, onSuccess, onClose }: OtpModalProps) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleOtpComplete(otp: string) {
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp, type);
      toast.success('Xác thực thành công!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await authApi.sendOtp(email, type);
      toast.success('Đã gửi lại mã OTP');
      setCooldown(60);
    } catch {
      toast.error('Không thể gửi lại OTP');
    } finally {
      setResending(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <OtpInput onComplete={handleOtpComplete} />
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Không nhận được mã?</p>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm font-semibold text-primary hover:text-primary-hover disabled:text-gray-400 disabled:cursor-not-allowed transition"
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : resending ? 'Đang gửi...' : 'Gửi lại OTP'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── 2FA Modal ────────────────────────────────────────────────────────────────

interface TwoFAModalProps {
  tempToken: string;
  onSuccess: (accessToken: string, user: any) => void;
  onClose: () => void;
}

export function TwoFAModal({ tempToken, onSuccess, onClose }: TwoFAModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleComplete(token: string) {
    setLoading(true);
    try {
      const res = await authApi.verify2FA(tempToken, token);
      onSuccess(res.data.data.accessToken, res.data.data.user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã 2FA không đúng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Xác thực 2FA</h2>
            <p className="text-sm text-gray-500">Nhập mã 6 chữ số từ ứng dụng Authenticator của bạn</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <OtpInput onComplete={handleComplete} />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
