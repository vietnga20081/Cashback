#!/bin/bash
# GreenCash - Installation Script
# Usage: bash install.sh

set -e

echo "🌿 ============================================"
echo "🌿  GreenCash Installation Script"
echo "🌿 ============================================"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js không được tìm thấy. Vui lòng cài Node.js 22+ trước."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Yêu cầu Node.js >= 20. Phiên bản hiện tại: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client không tìm thấy. Đảm bảo MySQL Server đã được cài đặt (qua aaPanel)."
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis client không tìm thấy. Đảm bảo Redis Server đã được cài đặt (qua aaPanel)."
fi

echo ""
echo "📦 Installing backend dependencies..."
cd apps/backend
npm install

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created apps/backend/.env — VUI LÒNG CẬP NHẬT THÔNG TIN DATABASE/REDIS/SMTP"
fi

echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "🗄️  Running database migrations..."
read -p "Bạn đã cập nhật DATABASE_URL trong .env chưa? (y/n) " confirmed
if [ "$confirmed" = "y" ]; then
    npx prisma migrate deploy
    echo "✅ Migrations completed"

    read -p "Bạn có muốn seed dữ liệu mẫu (admin user, merchants...)? (y/n) " seed_confirm
    if [ "$seed_confirm" = "y" ]; then
        npm run seed
        echo "✅ Database seeded"
    fi
else
    echo "⏭️  Bỏ qua migration. Hãy chạy 'npm run migrate' sau khi cập nhật .env"
fi

echo ""
echo "🏗️  Building backend..."
npm run build

cd ../frontend

echo ""
echo "📦 Installing frontend dependencies..."
npm install

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created apps/frontend/.env"
fi

echo ""
echo "🏗️  Building frontend..."
npm run build

cd ../..

echo ""
echo "✅ ============================================"
echo "✅  Installation Complete!"
echo "✅ ============================================"
echo ""
echo "📋 Next steps:"
echo "   1. Cập nhật apps/backend/.env với thông tin database, redis, SMTP"
echo "   2. Cập nhật apps/frontend/.env với API URL production"
echo "   3. Cấu hình Nginx (xem nginx/nginx.conf)"
echo "   4. Khởi động bằng PM2: pm2 start pm2/ecosystem.config.js"
echo "   5. Lưu PM2 process list: pm2 save"
echo ""
echo "🔐 Tài khoản admin mặc định (nếu đã seed):"
echo "   Email: admin@greencash.vn"
echo "   Password: Admin@123456"
echo "   ⚠️  HÃY ĐỔI MẬT KHẨU NGAY SAU KHI ĐĂNG NHẬP LẦN ĐẦU!"
