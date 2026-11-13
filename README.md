# 🌿 GreenCash — Nền tảng Cashback Affiliate

GreenCash là nền tảng hoàn tiền (cashback) hiện đại cho thị trường Việt Nam, hỗ trợ liên kết affiliate với **Shopee**, **TikTok Shop**, và **Lazada**. Thiết kế lấy cảm hứng từ Apple, Linear, Vercel và Stripe — sạch sẽ, tối giản, chuyên nghiệp.

---

## 📦 Tech Stack

**Frontend:** Vite · React 19 · TypeScript · TailwindCSS · Shadcn UI · React Query · Zustand · React Hook Form · Axios · Framer Motion · Recharts · React Router

**Backend:** Node.js 22 · Express · TypeScript · Prisma ORM · MySQL 8 · JWT + Refresh Token Rotation · Redis · BullMQ · Socket.io · Winston · Zod · Swagger

**Deploy:** PM2 · Nginx · aaPanel · Docker (tuỳ chọn) · Ubuntu 24.04

---

## 📁 Cấu trúc thư mục

```
greencash/
├── apps/
│   ├── frontend/          # React SPA
│   │   └── src/
│   │       ├── components/    # UI components, layouts, shared
│   │       ├── pages/          # Route pages (landing, auth, dashboard, admin)
│   │       ├── stores/         # Zustand state
│   │       ├── services/       # API client (axios)
│   │       └── hooks/, lib/, types/
│   └── backend/            # Express API
│       └── src/
│           ├── api/v1/         # Routes, controllers, middlewares, validators
│           ├── core/            # config, database, redis, queue, logger, socket, email
│           ├── modules/         # Domain modules (auth, wallet, affiliate, admin...)
│           ├── jobs/             # BullMQ processors + cron schedulers
│           ├── shared/           # Utils, AppError, constants
│           └── prisma/           # schema.prisma + seed.ts
├── packages/shared/         # Shared types between FE/BE (optional)
├── docker/                  # docker-compose.yml
├── nginx/                   # nginx.conf (aaPanel-ready)
├── pm2/                     # ecosystem.config.js
├── scripts/                 # install.sh, deploy.sh, backup.sh, restore.sh
└── docs/
```

---

## 🚀 Cài đặt nhanh (Local Development)

### Yêu cầu hệ thống
- Node.js >= 20 (khuyến nghị 22)
- MySQL 8.0+
- Redis 6+

### Bước 1 — Clone & cài dependencies

```bash
git clone <repo-url> greencash
cd greencash
npm install
```

### Bước 2 — Cấu hình môi trường

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Chỉnh sửa `apps/backend/.env`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/greencash"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=<random-secret-32-chars>
JWT_REFRESH_SECRET=<another-random-secret>
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Bước 3 — Khởi tạo database

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Tài khoản mặc định sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@greencash.vn | Admin@123456 |
| Demo User | demo@greencash.vn | Demo@123456 |

### Bước 4 — Chạy development server

```bash
# Terminal 1 — Backend (port 4000)
cd apps/backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd apps/frontend && npm run dev
```

Truy cập:
- Frontend: http://localhost:5173
- API Docs (Swagger): http://localhost:4000/api/v1/docs
- Health check: http://localhost:4000/health

---

## 🏗️ Build Production

```bash
npm run build:backend
npm run build:frontend
```

---

## 🌐 Triển khai Production (VPS + aaPanel)

### 1. Cài đặt môi trường qua aaPanel
Trong aaPanel App Store, cài đặt:
- **Node.js** (phiên bản 22 qua Node Version Manager)
- **MySQL** 8.0
- **Redis**
- **PM2 Manager** (hoặc cài global: `npm install -g pm2`)

### 2. Upload code & cài đặt

```bash
cd /www/wwwroot/greencash.vn
bash scripts/install.sh
```

Script sẽ tự động:
- Cài dependencies cho cả backend & frontend
- Generate Prisma client
- Chạy migration (sau khi bạn xác nhận đã cấu hình `.env`)
- Build cả hai ứng dụng
- Hỏi có seed dữ liệu mẫu hay không

### 3. Cấu hình Website trong aaPanel
1. Vào **Website → Add Site**, nhập domain `greencash.vn`
2. **KHÔNG** chọn PHP — chọn "Pure static" hoặc để trống vì chúng ta dùng Node.js qua PM2 + Nginx reverse proxy
3. Sau khi tạo site, vào phần **Config** của site và thay thế bằng nội dung trong [`nginx/nginx.conf`](./nginx/nginx.conf), chỉnh sửa đường dẫn `root` cho đúng với thư mục `apps/frontend/dist`

### 4. Cấu hình SSL (Let's Encrypt qua aaPanel)
1. Vào site vừa tạo → tab **SSL**
2. Chọn **Let's Encrypt**, nhập domain, bấm **Apply**
3. Bật **Force HTTPS**

### 5. Khởi động ứng dụng bằng PM2

```bash
cd /www/wwwroot/greencash.vn
pm2 start pm2/ecosystem.config.js
pm2 save
pm2 startup    # để PM2 tự khởi động cùng hệ thống
```

Kiểm tra trạng thái:
```bash
pm2 status
pm2 logs greencash-api
```

### 6. Reverse Proxy (đã có sẵn trong nginx.conf)
File `nginx/nginx.conf` đã cấu hình sẵn:
- `/api/*` → proxy tới `127.0.0.1:4000` (backend)
- `/socket.io/*` → proxy WebSocket cho Socket.io
- `/go/*` → tracking redirector cho affiliate link rút gọn
- SPA fallback cho React Router

---

## 🐳 Triển khai bằng Docker (tuỳ chọn)

```bash
cd docker
cp ../apps/backend/.env.example ../apps/backend/.env
# Chỉnh sửa .env

docker-compose up -d --build
```

Dịch vụ sẽ chạy tại:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

---

## 💾 Backup & Restore

### Backup tự động (khuyến nghị — thêm vào crontab)
```bash
crontab -e
# Thêm dòng sau để backup mỗi ngày lúc 3h sáng:
0 3 * * * /www/wwwroot/greencash.vn/scripts/backup.sh >> /www/wwwroot/greencash.vn/logs/backup.log 2>&1
```

### Backup thủ công
```bash
bash scripts/backup.sh
```
File backup được lưu tại `../backups/greencash_YYYYMMDD_HHMMSS.sql.gz`, tự động xoá file cũ hơn 30 ngày.

### Restore
```bash
bash scripts/restore.sh ../backups/greencash_20240101_030000.sql.gz
```

---

## 🔄 Cập nhật (Deploy mới)

```bash
bash scripts/deploy.sh
```
Script này sẽ: pull code mới → cài dependencies → chạy migration → build → reload PM2 (zero-downtime).

---

## 🔧 Cron Jobs nội bộ (BullMQ + node-cron)

Hệ thống tự động chạy các tác vụ định kỳ (xem `src/jobs/schedulers/index.ts`):

| Tần suất | Tác vụ |
|---|---|
| Mỗi 30 phút | Đồng bộ đơn hàng từ Shopee/TikTok/Lazada |
| Hàng ngày 1h sáng | Vô hiệu hoá affiliate link đã hết hạn |
| Hàng ngày 2h sáng | Tự động duyệt cashback quá hạn chờ |
| Hàng ngày 3h sáng | Dọn dẹp log cũ, thông báo đã đọc |
| Mỗi 6 giờ | Dọn dẹp refresh token / session hết hạn |

---

## 🤖 Telegram Bot

Cấu hình `TELEGRAM_BOT_TOKEN` trong `.env`, sau đó bot sẽ tự khởi động cùng server.

**Lệnh hỗ trợ:**
- `/start` — Khởi động / liên kết tài khoản
- `/link <url>` — Tạo link cashback trực tiếp từ Telegram
- `/wallet` — Xem số dư ví
- `/history` — Xem 5 cashback gần nhất
- `/profile` — Thông tin tài khoản
- `/withdraw` — Hướng dẫn rút tiền
- `/help` — Trợ giúp

---

## 🔐 Bảo mật đã triển khai

- **Helmet** — security headers
- **Rate limiting** — giới hạn theo IP cho auth & withdraw endpoints
- **CORS** — whitelist origin từ `FRONTEND_URL`
- **JWT + Refresh Token Rotation** — phát hiện reuse token, tự động thu hồi cả family khi phát hiện gian lận
- **2FA (TOTP)** — qua Google Authenticator / Authy
- **OTP Email** — xác thực đăng ký, quên mật khẩu
- **Bcrypt** — hash mật khẩu với 12 rounds
- **Audit Logs** — ghi lại mọi thao tác nhạy cảm của admin
- **Activity Logs** — lịch sử hoạt động người dùng
- **Zod Validation** — validate toàn bộ input ở tầng API

---

## 📖 API Documentation

Swagger UI tự động sinh từ JSDoc trong controllers, truy cập tại:
```
http://localhost:4000/api/v1/docs
```

Tất cả endpoint dùng prefix `/api/v1/` theo chuẩn versioning.

---

## 🧪 Code Standards

- **ESLint** + **Prettier** — tự động format khi commit (qua Husky + lint-staged)
- **Commitlint** — bắt buộc Conventional Commits (`feat:`, `fix:`, `chore:`...)
- **TypeScript strict mode** — bật cho cả frontend và backend
- **Repository + Service Pattern** — Prisma làm data layer, services chứa business logic, controllers chỉ xử lý HTTP

---

## 📋 Database Schema (Tóm tắt)

30+ bảng chính bao gồm: `users`, `roles`, `permissions`, `sessions`, `refresh_tokens`, `wallets`, `wallet_transactions`, `orders`, `cashbacks`, `withdraws`, `withdraw_accounts`, `giftcodes`, `giftcode_logs`, `notifications`, `saved_products`, `referrals`, `commissions`, `merchants`, `affiliate_links`, `telegram_accounts`, `zalo_accounts`, `settings`, `cms_pages`, `blogs`, `banners`, `faqs`, `activity_logs`, `email_templates`, `jobs`, `audit_logs`.

Xem chi tiết đầy đủ tại [`apps/backend/src/prisma/schema.prisma`](./apps/backend/src/prisma/schema.prisma).

---

## ⚠️ Lưu ý quan trọng trước khi đưa vào Production

1. **Đổi mật khẩu admin mặc định** ngay sau lần đăng nhập đầu tiên.
2. **Thay đổi tất cả secret keys** trong `.env` (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`).
3. **Đăng ký Affiliate Partner thật** với Shopee, TikTok Shop, Lazada để lấy API credentials thực — hiện tại hệ thống chạy ở chế độ demo (tự thêm tracking params) khi chưa có credentials.
4. **Cấu hình SMTP thật** (Gmail App Password hoặc dịch vụ như SendGrid/Mailgun) để gửi email OTP hoạt động.
5. **Bật firewall** trên VPS, chỉ mở port 80/443 ra ngoài; MySQL/Redis chỉ nên bind `127.0.0.1`.
6. **Thiết lập backup tự động** qua crontab như hướng dẫn ở trên.

---

## 📜 License

UNLICENSED — Proprietary software, dành riêng cho mục đích đã thoả thuận.
# Cashback
