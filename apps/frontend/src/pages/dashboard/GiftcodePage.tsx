import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Zap } from 'lucide-react';
import { giftcodeApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function GiftcodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function handleRedeem() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await giftcodeApi.redeem(code.trim().toUpperCase());
      toast.success(res.data.message);
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã không hợp lệ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nhập Giftcode</h1>
        <p className="text-gray-500 text-sm mt-1">Nhập mã để nhận thưởng cashback bonus</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-card border border-gray-50 text-center"
      >
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Gift className="w-8 h-8 text-primary" />
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="NHẬP MÃ GIFTCODE"
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition mb-4"
        />

        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Đang xử lý...' : 'Nhập mã'}
        </button>
      </motion.div>
    </div>
  );
}
