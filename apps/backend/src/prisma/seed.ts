const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ────────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      displayName: 'Quản trị viên',
      description: 'Toàn quyền hệ thống',
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      displayName: 'Người dùng',
      description: 'Người dùng thông thường',
      isSystem: true,
    },
  });

  console.log('✅ Roles created');

  // ─── Admin User ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greencash.vn' },
    update: {},
    create: {
      email: 'admin@greencash.vn',
      passwordHash: adminPassword,
      fullName: 'Admin GreenCash',
      referralCode: 'ADMIN001',
      roleId: adminRole.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log('✅ Admin user created: admin@greencash.vn / Admin@123456');

  // ─── Demo User ────────────────────────────────────────────────────────────────
  const demoPassword = await bcrypt.hash('Demo@123456', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@greencash.vn' },
    update: {},
    create: {
      email: 'demo@greencash.vn',
      passwordHash: demoPassword,
      fullName: 'Người Dùng Demo',
      referralCode: 'DEMO0001',
      roleId: userRole.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      availableBalance: 450000,
      pendingBalance: 85000,
      totalEarned: 1250000,
      totalWithdrawn: 800000,
    },
  });

  console.log('✅ Demo user created: demo@greencash.vn / Demo@123456');

  // ─── Merchants ────────────────────────────────────────────────────────────────
  const merchants = [
    {
      type: 'SHOPEE' as const,
      name: 'Shopee',
      logo: '/merchants/shopee.png',
      description: 'Sàn thương mại điện tử hàng đầu Đông Nam Á',
      baseCommission: 10.0,
      userCommission: 7.0,
      trackingDomain: 'shope.ee',
      cookieDuration: 30,
    },
    {
      type: 'TIKTOK' as const,
      name: 'TikTok Shop',
      logo: '/merchants/tiktok.png',
      description: 'Mua sắm kết hợp giải trí trên TikTok',
      baseCommission: 12.0,
      userCommission: 8.5,
      trackingDomain: 'tiktok.com',
      cookieDuration: 7,
    },
    {
      type: 'LAZADA' as const,
      name: 'Lazada',
      logo: '/merchants/lazada.png',
      description: 'Lazada Việt Nam - Mua sắm đa dạng',
      baseCommission: 9.5,
      userCommission: 6.5,
      trackingDomain: 'lazada.vn',
      cookieDuration: 30,
    },
  ];

  for (const m of merchants) {
    await prisma.merchant.upsert({
      where: { type: m.type },
      update: m,
      create: m,
    });
  }

  console.log('✅ Merchants created (Shopee, TikTok Shop, Lazada)');

  // ─── Settings ─────────────────────────────────────────────────────────────────
  const settings = [
    { key: 'site_name', value: 'GreenCash', type: 'string', group: 'general', label: 'Tên website', isPublic: true },
    { key: 'site_slogan', value: 'Cashback Platform', type: 'string', group: 'general', label: 'Slogan', isPublic: true },
    { key: 'site_url', value: 'https://greencash.vn', type: 'string', group: 'general', label: 'URL Website', isPublic: true },
    { key: 'min_withdraw', value: '50000', type: 'number', group: 'payment', label: 'Số tiền rút tối thiểu (VND)' },
    { key: 'referral_f1_rate', value: '5', type: 'number', group: 'referral', label: 'Hoa hồng F1 (%)' },
    { key: 'referral_f2_rate', value: '3', type: 'number', group: 'referral', label: 'Hoa hồng F2 (%)' },
    { key: 'referral_f3_rate', value: '1', type: 'number', group: 'referral', label: 'Hoa hồng F3 (%)' },
    { key: 'cashback_auto_approve_days', value: '15', type: 'number', group: 'cashback', label: 'Tự động duyệt cashback sau N ngày' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'general', label: 'Chế độ bảo trì' },
    { key: 'total_users', value: '50000', type: 'number', group: 'stats', label: 'Tổng thành viên (hiển thị)', isPublic: true },
    { key: 'total_cashback_paid', value: '5200000000', type: 'number', group: 'stats', label: 'Tổng tiền đã trả (VND)', isPublic: true },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log('✅ Settings created');

  // ─── Email Templates ──────────────────────────────────────────────────────────
  const templates = [
    {
      name: 'email-verify',
      subject: 'Xác thực email - GreenCash',
      body: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16A34A;">GreenCash</h2>
          <p>Xin chào,</p>
          <p>Mã xác thực email của bạn là:</p>
          <div style="background: #F0FDF4; border: 2px solid #16A34A; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16A34A;">{{otp}}</span>
          </div>
          <p>Mã sẽ hết hạn sau <strong>{{expireMinutes}} phút</strong>.</p>
          <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
        </div>
      `,
      variables: { otp: 'Mã OTP 6 chữ số', expireMinutes: 'Thời gian hết hạn' },
    },
    {
      name: 'password-reset',
      subject: 'Đặt lại mật khẩu - GreenCash',
      body: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16A34A;">GreenCash</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn:</p>
          <div style="background: #FEF9C3; border: 2px solid #F59E0B; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D97706;">{{otp}}</span>
          </div>
          <p>Mã hết hạn sau <strong>{{expireMinutes}} phút</strong>.</p>
        </div>
      `,
      variables: { otp: 'Mã OTP', expireMinutes: 'Thời gian hết hạn' },
    },
    {
      name: 'cashback-paid',
      subject: 'Cashback đã được thanh toán - GreenCash',
      body: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16A34A;">🎉 Cashback đã vào ví!</h2>
          <p>Chúc mừng <strong>{{userName}}</strong>!</p>
          <p>Bạn vừa nhận được <strong style="color: #16A34A;">{{amount}}đ</strong> cashback từ đơn hàng trên <strong>{{merchant}}</strong>.</p>
          <p>Số dư hiện tại: <strong>{{balance}}đ</strong></p>
          <a href="{{dashboardUrl}}" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Xem ví của tôi</a>
        </div>
      `,
      variables: { userName: 'Tên user', amount: 'Số tiền', merchant: 'Tên sàn', balance: 'Số dư', dashboardUrl: 'URL dashboard' },
    },
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
  }

  console.log('✅ Email templates created');

  // ─── Demo Giftcodes ───────────────────────────────────────────────────────────
  const giftcodes = [
    {
      code: 'WELCOME2024',
      description: 'Bonus cashback cho thành viên mới',
      type: 'CASHBACK_BONUS',
      value: 50000,
      usageLimit: 1000,
      perUserLimit: 1,
      expiresAt: new Date('2024-12-31'),
    },
    {
      code: 'GREEN10',
      description: 'Giảm 10% cashback tối đa 100k',
      type: 'PERCENT',
      value: 10,
      maxDiscount: 100000,
      usageLimit: 500,
    },
  ];

  for (const g of giftcodes) {
    await prisma.giftcode.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }

  console.log('✅ Giftcodes created');

  // ─── Sample Banners ───────────────────────────────────────────────────────────
  await prisma.banner.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Hoàn tiền lên đến 10% từ TikTok Shop',
      image: '/banners/tiktok-cashback.jpg',
      link: '/register',
      position: 'HERO',
      sortOrder: 1,
      isActive: true,
    },
  });

  console.log('✅ Banners created');

  // ─── FAQs ─────────────────────────────────────────────────────────────────────
  const faqs = [
    { question: 'GreenCash là gì?', answer: 'GreenCash là nền tảng hoàn tiền (cashback) khi bạn mua sắm trên Shopee, TikTok Shop và Lazada. Bạn chỉ cần dùng link từ GreenCash để mua hàng và nhận cashback tự động.', sortOrder: 1 },
    { question: 'Cashback được trả trong bao lâu?', answer: 'Thông thường cashback được xác nhận trong 7-15 ngày sau khi đơn hàng hoàn tất và không bị hoàn trả. Cashback sau đó được cộng vào ví và bạn có thể rút ngay.', sortOrder: 2 },
    { question: 'Số tiền rút tối thiểu là bao nhiêu?', answer: 'Số tiền rút tối thiểu là 50,000đ. Bạn có thể rút qua ngân hàng, Momo, ZaloPay hoặc USDT.', sortOrder: 3 },
    { question: 'Chương trình giới thiệu hoạt động thế nào?', answer: 'Khi bạn giới thiệu bạn bè đăng ký và mua hàng, bạn nhận được hoa hồng F1 (5%), F2 (3%), F3 (1%) từ mỗi lần họ nhận cashback. Hoàn toàn miễn phí và không giới hạn.', sortOrder: 4 },
    { question: 'GreenCash có mất phí không?', answer: 'Hoàn toàn miễn phí! GreenCash kiếm tiền từ hoa hồng affiliate và chia sẻ một phần với người dùng dưới dạng cashback.', sortOrder: 5 },
  ];

  for (const [i, faq] of faqs.entries()) {
    await prisma.faq.upsert({
      where: { id: i + 1 },
      update: {},
      create: { ...faq, isActive: true },
    });
  }

  console.log('✅ FAQs created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Login credentials:');
  console.log('   Admin: admin@greencash.vn / Admin@123456');
  console.log('   Demo:  demo@greencash.vn  / Demo@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
