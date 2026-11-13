import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { userApi } from '../../services/api';

export function ActivityLogPage() {
  const { data } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => userApi.getActivityLogs({ limit: 50 }).then(r => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nhật ký hoạt động</h1>
        <p className="text-gray-500 text-sm mt-1">Lịch sử hoạt động trên tài khoản của bạn</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden"
      >
        {!data?.logs?.length ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{log.description || log.action}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {log.ipAddress} • {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
