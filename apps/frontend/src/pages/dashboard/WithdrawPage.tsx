import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Plus, Building2, Smartphone, Wallet as WalletIcon, Coins, Check, X } from 'lucide-react';
import { walletApi } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const methodConfig: Record<string, { label: string; icon: any; color: string }> = {
  BANK_TRANSFER: { label: 'Ngân hàng', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  MOMO: { label: 'Momo', icon: Smartphone, color: 'text-pink-600 bg-pink-50' },
  ZALOPAY: { label: 'ZaloPay', icon: WalletIcon, color: 'text-sky-600 bg-sky-50' },
  USDT: { label: 'USDT', icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
};

function AddAccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [method, setMethod] = useState<keyof typeof methodConfig>('BANK_TRANSFER');
  const [form, setForm] = useState({ accountName: '', accountNo: '', bankName: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.accountName || !form.accountNo) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      await walletApi.addWithdrawAccount({ method, ...form });
      toast.success('Đã thêm tài khoản!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thêm tài khoản');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Thêm tài khoản nhận tiền</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {Object.entries(methodConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMethod(key as any)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition',
                method === key ? 'border-primary bg-primary-50' : 'border-gray-100 hover:border-gray-200'
              )}
            >
              <cfg.icon className={cn('w-5 h-5', method === key ? 'text-primary' : 'text-gray-400')} />
              <span className="text-xs font-medium text-gray-700">{cfg.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {method === 'BANK_TRANSFER' ? 'Tên chủ tài khoản' : 'Tên người nhận'}
            </label>
            <input
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {method === 'BANK_TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên ngân hàng</label>
              <input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="VD: Vietcombank"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {method === 'BANK_TRANSFER' ? 'Số tài khoản' : method === 'USDT' ? 'Địa chỉ wallet' : 'Số điện thoại'}
            </label>
            <input
              value={form.accountNo}
              onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition disabled:opacity-60"
        >
          {loading ? 'Đang xử lý...' : 'Thêm tài khoản'}
        </button>
      </motion.div>
    </div>
  );
}

export function WithdrawPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet().then(r => r.data.data),
  });

  const { data: accounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['withdraw-accounts'],
    queryFn: () => walletApi.getWithdrawAccounts().then(r => r.data.data),
  });

  const availableBalance = Number(wallet?.availableBalance || 0);
  const quickAmounts = [50000, 100000, 200000, 500000];

  async function handleWithdraw() {
    const amountNum = Number(amount);
    if (!selectedAccount) {
      toast.error('Vui lòng chọn tài khoản nhận tiền');
      return;
    }
    if (amountNum < 50000) {
      toast.error('Số tiền rút tối thiểu là 50,000đ');
      return;
    }
    if (amountNum > availableBalance) {
      toast.error('Số dư không đủ');
      return;
    }

    setLoading(true);
    try {
      await walletApi.requestWithdraw({ accountId: selectedAccount, amount: amountNum });
      toast.success('Yêu cầu rút tiền đã được gửi!');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rút tiền</h1>
        <p className="text-gray-500 text-sm mt-1">Rút tiền từ ví về tài khoản của bạn</p>
      </div>

      {/* Balance */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary-700 rounded-2xl p-6 text-white"
      >
        <div className="text-sm opacity-80 mb-1">Số dư khả dụng</div>
        <div className="text-3xl font-bold">{availableBalance.toLocaleString('vi-VN')}đ</div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-50 space-y-5"
      >
        {/* Account selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Tài khoản nhận tiền</label>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary-hover"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm tài khoản
            </button>
          </div>

          {!accounts?.length ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Chưa có tài khoản nào</p>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-primary font-medium">
                + Thêm tài khoản đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc: any) => {
                const cfg = methodConfig[acc.method];
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left',
                      selectedAccount === acc.id ? 'border-primary bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', cfg.color)}>
                      <cfg.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{acc.accountName}</div>
                      <div className="text-xs text-gray-400">{cfg.label} • {acc.accountNo}</div>
                    </div>
                    {selectedAccount === acc.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền rút</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
          <div className="flex gap-2 mt-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                {(amt / 1000)}k
              </button>
            ))}
            <button
              onClick={() => setAmount(String(availableBalance))}
              className="flex-1 py-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 rounded-lg transition"
            >
              Tối đa
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Số tiền rút tối thiểu: 50,000đ</p>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={loading || !selectedAccount || !amount}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Đang xử lý...' : 'Gửi yêu cầu rút tiền'}
        </button>
      </motion.div>

      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={refetchAccounts} />
      )}
    </div>
  );
}
