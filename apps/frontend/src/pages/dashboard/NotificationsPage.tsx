import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../services/api';
import { cn } from '../../lib/utils';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications-all'],
    queryFn: () => notificationApi.getAll({ limit: 50 }).then(r => r.data.data),
  });

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  }

  async function handleMarkRead(id: string) {
    await notificationApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-500 text-sm mt-1">Cập nhật mới nhất từ GreenCash</p>
        </div>
        <button onClick={handleMarkAllRead} className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-hover">
          <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc tất cả
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        {!data?.notifications?.length ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.notifications.map((n: any) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={cn(
                  'w-full text-left flex items-start gap-3 px-6 py-4 hover:bg-gray-50/50 transition',
                  !n.isRead && 'bg-primary-50/30'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !n.isRead ? 'bg-primary' : 'bg-transparent')} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{n.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
