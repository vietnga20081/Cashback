import { Outlet, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-green">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">GreenCash</div>
            <div className="text-xs text-gray-400 -mt-0.5 hidden sm:block">Cashback Platform</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition shadow-green"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">GreenCash</span>
            </div>
            <p className="text-sm leading-relaxed">Nền tảng hoàn tiền khi mua sắm Shopee, TikTok Shop, Lazada.</p>
          </div>

          {[
            {
              title: 'Tính năng',
              links: ['Cashback', 'Giới thiệu', 'Rút tiền', 'Giftcode'],
            },
            {
              title: 'Hỗ trợ',
              links: ['FAQ', 'Liên hệ', 'Blog', 'Điều khoản'],
            },
            {
              title: 'Kết nối',
              links: ['Telegram', 'Zalo', 'Facebook', 'API'],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-primary transition">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2024 GreenCash. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="#" className="hover:text-primary transition">Chính sách bảo mật</a>
            <a href="#" className="hover:text-primary transition">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AuthLayout() {
  return <Outlet />;
}
