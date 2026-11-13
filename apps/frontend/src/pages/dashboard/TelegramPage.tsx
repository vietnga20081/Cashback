import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ExternalLink, CheckCircle } from 'lucide-react';
import { userApi } from '../../services/api';
import toast from 'react-hot-toast';

export function TelegramPage() {
  const [deepLink, setDeepLink] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerateLink() {
    setLoading(true);
    try {
      const res = await userApi.linkTelegram ? null : null;
      const result = await (await import('../../services/api')).api.get('/user/telegram/link-token');
      setDeepLink(result.data.data.deepLink);
    } catch {
      toast.error('Không thể tạo link liên kết');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kết nối Telegram</h1>
        <p className="text-gray-500 text-sm mt-1">Nhận thông báo cashback và quản lý tài khoản qua Telegram</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-card border border-gray-50 text-center"
      >
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Bot className="w-8 h-8 text-blue-500" />
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">Bot GreenCash trên Telegram</h3>
        <p className="text-sm text-gray-500 mb-6">
          Liên kết tài khoản để nhận thông báo cashback, kiểm tra số dư, và tạo link affiliate trực tiếp từ Telegram.
        </p>

        {!deepLink ? (
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Đang tạo liên kết...' : 'Tạo liên kết Telegram'}
          </button>
        ) : (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            Mở Telegram để liên kết <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-2">
          <p className="text-xs font-medium text-gray-600 mb-2">Các lệnh có sẵn:</p>
          {['/wallet — Xem số dư', '/history — Lịch sử cashback', '/link <url> — Tạo link cashback', '/profile — Thông tin tài khoản'].map(cmd => (
            <div key={cmd} className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
              {cmd}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
