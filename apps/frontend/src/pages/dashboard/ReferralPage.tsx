import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Copy, Check, Users, TrendingUp, Gift, Share2,
  ChevronRight, Clock, DollarSign, Award,
  ShoppingBag, Layers
} from 'lucide-react';
import { referralApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

// ─── Commission level config ──────────────────────────────────────────────────

const LEVEL_CFG = {
  1: { label: 'F1', desc: 'Bạn bè trực tiếp', color: 'text-primary', bg: 'bg-primary-50', border: 'border-primary-200', rate: 5 },
  2: { label: 'F2', desc: 'Bạn của bạn bè',  color: 'text-blue-600',  bg: 'bg-blue-50',    border: 'border-blue-200',    rate: 3 },
  3: { label: 'F3', desc: 'Cấp 3',            color: 'text-purple-600',bg: 'bg-purple-50',  border: 'border-purple-200',  rate: 1 },
} as const;

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PAID:    { label: 'Đã trả',    color: 'text-primary',   bg: 'bg-primary-50' },
  PENDING: { label: 'Đang chờ', color: 'text-amber-600', bg: 'bg-amber-50'   },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
      title={`Sao chép ${label}`}
    >
      {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
    </button>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-card border border-gray-50"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Network Tab ──────────────────────────────────────────────────────────────

function NetworkTab({ userId }: { userId: string }) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['referral-network', level, page],
    queryFn: () => referralApi.getNetwork(level, page, 15).then(r => r.data.data),
  });

  const cfg = LEVEL_CFG[level];

  return (
    <div className="space-y-4">
      {/* Level tabs */}
      <div className="flex gap-2">
        {([1, 2, 3] as const).map(l => {
          const c = LEVEL_CFG[l];
          return (
            <button
              key={l}
              onClick={() => { setLevel(l); setPage(1); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition',
                level === l
                  ? `${c.bg} ${c.color} ${c.border}`
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              )}
            >
              {c.label}
              <span className="text-xs font-normal ml-1">({c.rate}%)</span>
            </button>
          );
        })}
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.members?.length ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-50">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', cfg.bg)}>
            <Users className={cn('w-6 h-6', cfg.color)} />
          </div>
          <p className="text-sm font-medium text-gray-700">Chưa có thành viên {cfg.label}</p>
          <p className="text-xs text-gray-400 mt-1">
            {level === 1
              ? 'Chia sẻ link giới thiệu để có thành viên F1'
              : `Khi F${level - 1} của bạn giới thiệu người dùng, họ sẽ trở thành ${cfg.label} của bạn`}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-50">
            <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">{data.total} thành viên {cfg.label}</span>
              <span className="text-xs text-gray-400">Hoa hồng bạn nhận</span>
            </div>

            <div className="divide-y divide-gray-50">
              {data.members.map((m: any, i: number) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition"
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    level === 1 ? 'bg-gradient-to-br from-primary-400 to-primary-600'
                    : level === 2 ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
                  )}>
                    {m.fullName?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{m.fullName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{m.email}</span>
                      {m.totalOrders > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <ShoppingBag className="w-3 h-3" />{m.totalOrders} đơn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Joined */}
                  <div className="text-right flex-shrink-0">
                    {m.commissionEarned > 0 ? (
                      <>
                        <div className={cn('text-sm font-bold', cfg.color)}>
                          +{Number(m.commissionEarned).toLocaleString('vi-VN')}đ
                        </div>
                        <div className="text-xs text-gray-400">hoa hồng</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">
                        {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Trang {page} / {data.pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Trước
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Commission History Tab ────────────────────────────────────────────────────

function CommissionsTab() {
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['referral-commissions', levelFilter, statusFilter, page],
    queryFn: () => referralApi.getCommissions({
      level: levelFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit: 15,
    }).then(r => r.data.data),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tất cả cấp</option>
          <option value="F1">F1 (5%)</option>
          <option value="F2">F2 (3%)</option>
          <option value="F3">F3 (1%)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PAID">Đã trả</option>
          <option value="PENDING">Đang chờ</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.commissions?.length ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-50">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">Chưa có hoa hồng nào</p>
          <p className="text-xs text-gray-400 mt-1">Hoa hồng sẽ được tính khi thành viên giới thiệu nhận cashback</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-50">
            <div className="divide-y divide-gray-50">
              {data.commissions.map((c: any, i: number) => {
                const lCfg = LEVEL_CFG[c.level === 'F1' ? 1 : c.level === 'F2' ? 2 : 3];
                const sCfg = STATUS_CFG[c.status] || STATUS_CFG.PENDING;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition"
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0', lCfg.bg, lCfg.color)}>
                      {c.level}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        Từ {c.sourceUserName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-md', sCfg.bg, sCfg.color)}>
                          {sCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={cn('text-sm font-bold', lCfg.color)}>
                        +{Number(c.amount).toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-xs text-gray-400">{c.rate}% hoa hồng</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {data.pagination?.pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Trang {page} / {data.pagination.pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Trước
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'network' | 'commissions';

export function ReferralPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: info, isLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: () => referralApi.getInfo().then(r => r.data.data),
  });

  const referralCode = info?.referralCode || user?.referralCode || '...';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  function share() {
    if (navigator.share) {
      navigator.share({
        title: 'GreenCash - Hoàn tiền khi mua sắm',
        text: `Tham gia GreenCash nhận cashback khi mua sắm trên Shopee, TikTok, Lazada!\nDùng mã giới thiệu: ${referralCode}`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success('Đã sao chép link giới thiệu!');
    }
  }

  const tabs = [
    { key: 'overview',    label: 'Tổng quan',  icon: Layers },
    { key: 'network',     label: 'Mạng lưới',  icon: Users },
    { key: 'commissions', label: 'Hoa hồng',   icon: DollarSign },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Giới thiệu bạn bè</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kiếm hoa hồng đa cấp khi bạn bè và mạng lưới của bạn mua sắm
        </p>
      </div>

      {/* Referral card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -left-4 -bottom-8 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-sm font-medium">Mã giới thiệu của bạn</span>
            </div>
            {info?.topReferrer && (
              <span className="flex items-center gap-1 bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Award className="w-3 h-3" /> Top Referrer
              </span>
            )}
          </div>

          <div className="text-4xl font-bold font-mono tracking-[0.2em] mb-5">
            {referralCode}
          </div>

          {/* Copy boxes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
              <span className="text-sm text-white/80 flex-1 font-mono font-semibold">{referralCode}</span>
              <CopyButton text={referralCode} label="mã giới thiệu" />
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
              <span className="text-xs text-white/60 flex-1 truncate">{referralLink}</span>
              <CopyButton text={referralLink} label="link giới thiệu" />
            </div>
          </div>

          <button
            onClick={share}
            className="mt-4 w-full py-2.5 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-primary-50 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            Chia sẻ ngay
          </button>
        </div>
      </motion.div>

      {/* Commission structure cards */}
      <div className="grid grid-cols-3 gap-3">
        {([1, 2, 3] as const).map((level, i) => {
          const c = LEVEL_CFG[level];
          const count = level === 1 ? info?.f1Count : level === 2 ? info?.f2Count : info?.f3Count;
          const commission = level === 1 ? info?.f1Commission : level === 2 ? info?.f2Commission : info?.f3Commission;
          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className={cn('rounded-2xl p-4 border-2', c.bg, c.border)}
            >
              <div className={cn('text-2xl font-bold', c.color)}>{c.label}</div>
              <div className={cn('text-xs font-medium mb-2', c.color)}>{c.rate}% hoa hồng</div>
              <div className="text-sm font-bold text-gray-900">{count ?? 0} người</div>
              <div className="text-xs text-gray-500">
                {Number(commission || 0).toLocaleString('vi-VN')}đ nhận được
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng người giới thiệu" value={info?.totalReferrals ?? 0}         icon={Users}      color="bg-primary"    delay={0.15} />
        <StatCard label="Hoa hồng đã nhận"      value={`${Number(info?.totalCommission ?? 0).toLocaleString('vi-VN')}đ`} icon={TrendingUp}  color="bg-blue-500"   delay={0.2} />
        <StatCard label="Đang chờ xác nhận"     value={`${Number(info?.pendingCommission ?? 0).toLocaleString('vi-VN')}đ`} icon={Clock}       color="bg-amber-500"  delay={0.25} />
        <StatCard label="Tháng này"             value={`${Number(info?.commissionThisMonth ?? 0).toLocaleString('vi-VN')}đ`} icon={Gift}        color="bg-purple-500" delay={0.3} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-50 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Cơ cấu hoa hồng chi tiết</h3>

                {([1, 2, 3] as const).map(level => {
                  const c = LEVEL_CFG[level];
                  const count = level === 1 ? info?.f1Count : level === 2 ? info?.f2Count : info?.f3Count;
                  const commission = level === 1 ? info?.f1Commission : level === 2 ? info?.f2Commission : info?.f3Commission;
                  return (
                    <div key={level} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0', c.bg, c.color)}>
                        {c.label}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{c.desc}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {c.rate}% trên mỗi cashback thành công của thành viên {c.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {count ?? 0} thành viên • {Number(commission || 0).toLocaleString('vi-VN')}đ đã nhận
                        </div>
                      </div>
                      <div className={cn('text-2xl font-bold', c.color)}>{c.rate}%</div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    💡 Hoa hồng được tính tự động và cộng vào ví ngay khi thành viên giới thiệu nhận được cashback.
                    Không giới hạn số lượng người giới thiệu. Tối đa 3 cấp (F1 → F2 → F3).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'network' && <NetworkTab userId={user?.id || ''} />}
            {activeTab === 'commissions' && <CommissionsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
