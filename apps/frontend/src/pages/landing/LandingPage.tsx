import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Zap, Shield, TrendingUp, Users, Package,
  DollarSign, ChevronRight, Star, Copy, Check, Search,
  ShoppingBag, Play, BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { publicApi } from '../../services/api';
import { cn } from '../../lib/utils';

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);

  function detectPlatform(value: string) {
    if (value.includes('shopee')) setDetectedPlatform('Shopee');
    else if (value.includes('tiktok')) setDetectedPlatform('TikTok Shop');
    else if (value.includes('lazada')) setDetectedPlatform('Lazada');
    else setDetectedPlatform(null);
  }

  async function handleGetLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    const isLoggedIn = !!localStorage.getItem('greencash-auth');
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để lấy link cashback');
      window.location.href = '/login?redirect=/dashboard';
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/dashboard';
    }, 800);
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-green-50">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-green-100/30 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#16A34A 1px, transparent 1px), linear-gradient(90deg, #16A34A 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white border border-primary-200 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 shadow-sm"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Nền tảng hoàn tiền #1 Việt Nam
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6"
          >
            Mua sắm thông minh,{' '}
            <span className="text-primary relative">
              hoàn tiền
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M1 8C50 3 100 1 150 5C200 9 250 7 299 4" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>{' '}
            tự động
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto"
          >
            Nhập link sản phẩm từ Shopee, TikTok Shop, Lazada — nhận ngay link affiliate
            và hoàn tiền vào ví GreenCash của bạn.
          </motion.p>

          {/* Search Box */}
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleGetLink}
            className="relative max-w-2xl mx-auto mb-4"
          >
            <div className="relative flex bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
              <div className="flex items-center pl-4 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); detectPlatform(e.target.value); }}
                placeholder="Dán link sản phẩm Shopee, TikTok Shop, Lazada..."
                className="flex-1 px-4 py-4 text-gray-700 placeholder-gray-400 bg-transparent outline-none text-sm md:text-base"
              />
              {detectedPlatform && (
                <div className="flex items-center px-3">
                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium">
                    {detectedPlatform}
                  </span>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !url}
                className="m-1.5 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Lấy Link Cashback
              </button>
            </div>
          </motion.form>

          {/* Platform badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-sm text-gray-500"
          >
            <span>Hỗ trợ:</span>
            {[
              { name: 'Shopee', color: '#EE4D2D', bg: '#FFF1EE' },
              { name: 'TikTok Shop', color: '#010101', bg: '#F0F0F0' },
              { name: 'Lazada', color: '#0F146D', bg: '#EEF0FF' },
            ].map((p) => (
              <span
                key={p.name}
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ color: p.color, background: p.bg }}
              >
                {p.name}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-green hover:shadow-lg hover:-translate-y-0.5"
            >
              Tạo tài khoản miễn phí
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl font-semibold border border-gray-200 hover:border-primary-200 hover:text-primary transition-all"
            >
              <Play className="w-4 h-4" />
              Đăng nhập
            </Link>
          </motion.div>
        </div>

        {/* Floating cards */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:block"
        >
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 w-48">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-gray-600">Cashback hôm nay</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">₫2.4M</div>
            <div className="text-xs text-primary mt-1">+12% so với hôm qua</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute right-8 top-1/3 hidden xl:block"
        >
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 w-52">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-gray-600">Vừa hoàn tiền</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-primary text-white text-xs flex items-center justify-center font-bold">T</div>
              <div>
                <div className="text-xs font-medium text-gray-800">Trần Minh T.</div>
                <div className="text-xs text-primary font-semibold">+₫145,000</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Section ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-gray-50 flex items-center gap-4"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </motion.div>
  );
}

function StatsSection({ stats }: { stats: any }) {
  const items = [
    { label: 'Thành viên đăng ký', value: stats?.totalUsers || '50,000+', icon: Users, color: 'bg-blue-500' },
    { label: 'Đơn hoàn tiền thành công', value: stats?.totalOrders || '120,000+', icon: Package, color: 'bg-primary' },
    { label: 'Tổng tiền đã trả', value: stats?.totalCashback || '₫5.2 tỷ', icon: DollarSign, color: 'bg-amber-500' },
    { label: 'Đánh giá người dùng', value: '4.9 ★', icon: Star, color: 'bg-orange-400' },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-primary-50/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard {...item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Sao chép link sản phẩm',
      desc: 'Tìm sản phẩm bạn muốn mua trên Shopee, TikTok Shop hoặc Lazada và sao chép link.',
      color: 'bg-primary-50 text-primary',
    },
    {
      step: '02',
      title: 'Lấy link cashback',
      desc: 'Dán link vào GreenCash, hệ thống tự động tạo link affiliate và hiển thị cashback dự kiến.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      step: '03',
      title: 'Mua hàng như bình thường',
      desc: 'Click vào link cashback và mua hàng. GreenCash tự động theo dõi đơn hàng của bạn.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      step: '04',
      title: 'Nhận tiền về ví',
      desc: 'Sau khi đơn hàng được xác nhận, cashback tự động cộng vào ví và bạn có thể rút bất kỳ lúc nào.',
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary text-sm font-semibold uppercase tracking-wider"
          >
            Cách hoạt động
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mt-2"
          >
            Đơn giản. Nhanh chóng. Miễn phí.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all relative z-10">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-4', step.color)}>
                  {step.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Merchants Section ─────────────────────────────────────────────────────────

function MerchantsSection() {
  const merchants = [
    {
      name: 'Shopee',
      logo: '🛒',
      commission: 'Lên đến 8%',
      color: 'from-orange-400 to-red-400',
      bg: '#FFF1EE',
      desc: 'Cashback từ tất cả danh mục sản phẩm trên Shopee',
    },
    {
      name: 'TikTok Shop',
      logo: '🎵',
      commission: 'Lên đến 10%',
      color: 'from-gray-800 to-black',
      bg: '#F0F0F0',
      desc: 'Hoàn tiền từ livestream và sản phẩm trending',
    },
    {
      name: 'Lazada',
      logo: '📦',
      commission: 'Lên đến 7%',
      color: 'from-blue-600 to-indigo-700',
      bg: '#EEF0FF',
      desc: 'Cashback cho toàn bộ sản phẩm trên Lazada VN',
    },
  ];

  return (
    <section className="py-20 bg-primary-50/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Đối tác</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Sàn thương mại hỗ trợ</h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">Mua sắm trên các sàn lớn nhất và nhận cashback tự động</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {merchants.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all border border-gray-50"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto"
                style={{ background: m.bg }}
              >
                {m.logo}
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">{m.name}</h3>
              <div className={cn('text-center text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent mb-3', m.color)}>
                {m.commission}
              </div>
              <p className="text-sm text-gray-500 text-center">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ──────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Tạo link tức thì',
      desc: 'Phân tích URL và tạo affiliate link trong vòng 1 giây.',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      icon: Shield,
      title: 'Bảo mật 2 lớp',
      desc: 'Bảo vệ tài khoản với 2FA và mã hóa dữ liệu.',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      title: 'Hoa hồng đa cấp',
      desc: 'Giới thiệu bạn bè nhận thêm hoa hồng F1, F2, F3.',
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
    {
      icon: ShoppingBag,
      title: 'Lưu sản phẩm yêu thích',
      desc: 'Bookmark sản phẩm muốn mua và theo dõi giá cả.',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Tính năng</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Tất cả những gì bạn cần</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-card-hover transition-all"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                <f.icon className={cn('w-6 h-6', f.color)} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ───────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bắt đầu nhận cashback ngay hôm nay
            </h2>
            <p className="text-primary-100 mb-8 text-lg max-w-xl mx-auto">
              Miễn phí hoàn toàn. Không cần thẻ tín dụng. Đăng ký trong 30 giây.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Đăng ký miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export function LandingPage() {
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => publicApi.getStats().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <HeroSection />
      <StatsSection stats={stats} />
      <HowItWorksSection />
      <MerchantsSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  );
}
