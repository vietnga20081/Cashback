#!/bin/bash
# ================================================================
# GreenCash - Complete Deploy Script for aaPanel VPS
# Domain: cashback.v3vn.eu
# Run from: /www/wwwroot/cashback.v3vn.eu
# Usage: bash scripts/deploy.sh
# ================================================================

set -e

DOMAIN="cashback.v3vn.eu"
ROOT_DIR="/www/wwwroot/${DOMAIN}"
BACKEND_DIR="${ROOT_DIR}/apps/backend"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"
NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
LOG_DIR="/www/wwwlogs"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${GREEN}========================================${NC}"; echo -e "${GREEN} $1${NC}"; echo -e "${GREEN}========================================${NC}"; }

# ================================================================
# STEP 0 — Pre-flight
# ================================================================
header "STEP 0 — Pre-flight checks"

cd "$ROOT_DIR" || error "Không tìm thấy $ROOT_DIR"
log "Working directory: $(pwd)"

NODE_VER=$(node -v 2>/dev/null | cut -d'.' -f1 | tr -d 'v' || echo "0")
[ "$NODE_VER" -lt 20 ] && error "Cần Node.js >= 20. Hiện tại: $(node -v)"
log "Node.js: $(node -v)"

if ! command -v pm2 &>/dev/null; then
  warn "PM2 chưa cài. Đang cài..."
  npm install -g pm2 --ignore-scripts
fi
log "PM2: $(pm2 --version)"

# ================================================================
# STEP 1 — Setup .env
# ================================================================
header "STEP 1 — Environment config"

if [ ! -f "${BACKEND_DIR}/.env" ]; then
  [ -f "${BACKEND_DIR}/.env.example" ] || error "Không tìm thấy .env.example"
  cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
  warn "Đã tạo apps/backend/.env — HÃY CẤU HÌNH TRƯỚC KHI TIẾP TỤC"
  warn "Cần điền: DATABASE_URL, REDIS_HOST, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SMTP_*"
  read -p "Bạn đã cập nhật .env chưa? (y/n): " env_ok
  [ "$env_ok" != "y" ] && error "Hãy cấu hình .env rồi chạy lại."
else
  log ".env đã tồn tại"
fi

# Frontend .env
if [ ! -f "${FRONTEND_DIR}/.env" ]; then
  cat > "${FRONTEND_DIR}/.env" << ENVEOF
VITE_API_URL=https://${DOMAIN}/api/v1
VITE_SOCKET_URL=https://${DOMAIN}
VITE_APP_NAME=GreenCash
ENVEOF
  log "Đã tạo apps/frontend/.env"
else
  sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://${DOMAIN}/api/v1|g" "${FRONTEND_DIR}/.env"
  sed -i "s|VITE_SOCKET_URL=.*|VITE_SOCKET_URL=https://${DOMAIN}|g" "${FRONTEND_DIR}/.env"
  log "apps/frontend/.env URLs updated"
fi

# ================================================================
# STEP 2 — Install BACKEND dependencies
# ================================================================
header "STEP 2 — Install backend dependencies"

cd "$BACKEND_DIR"

# Pin Prisma to v5 to avoid conflict with Prisma 7 global CLI on aaPanel
npm pkg set dependencies.prisma="5.14.0"
npm pkg set dependencies.@prisma/client="5.14.0"

# --ignore-scripts prevents husky/prepare from running
# --legacy-peer-deps bypasses ESLint peer conflict
npm install --ignore-scripts --legacy-peer-deps

log "Backend dependencies installed"

[ -f "node_modules/.bin/prisma" ] || error "prisma binary not found"
[ -f "node_modules/.bin/tsx" ]    || error "tsx binary not found"
PRISMA_VER=$(./node_modules/.bin/prisma --version 2>/dev/null | head -1)
log "Prisma (local): ${PRISMA_VER}"

# ================================================================
# STEP 3 — Prisma generate & migrate (LOCAL binary only)
# ================================================================
header "STEP 3 — Database setup"

PRISMA="./node_modules/.bin/prisma"
SCHEMA="src/prisma/schema.prisma"

[ -f "$SCHEMA" ] || error "Schema không tồn tại: $SCHEMA"

log "Running prisma generate..."
$PRISMA generate --schema="$SCHEMA"

log "Running prisma migrate deploy..."
$PRISMA migrate deploy --schema="$SCHEMA"

log "Database migration complete"

# Run manual migration for referral unique constraint fix
# (safe to run multiple times — ALTER TABLE is idempotent if index already exists)
BACKEND_ENV="${BACKEND_DIR}/.env"
if [ -f "$BACKEND_ENV" ]; then
  DB_URL=$(grep "^DATABASE_URL=" "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"')
  if [ -n "$DB_URL" ]; then
    # Extract mysql credentials from URL: mysql://user:pass@host:port/dbname
    DB_USER=$(echo "$DB_URL" | sed 's|mysql://||' | cut -d':' -f1)
    DB_PASS=$(echo "$DB_URL" | sed 's|mysql://[^:]*:||' | cut -d'@' -f1)
    DB_HOST=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f1)
    DB_PORT=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f2 | cut -d'/' -f1)
    DB_NAME=$(echo "$DB_URL" | rev | cut -d'/' -f1 | rev | cut -d'?' -f1)
    DB_PORT=${DB_PORT:-3306}

    MIGRATION_SQL="${BACKEND_DIR}/src/prisma/migrations/20240701_fix_referral_unique/migration.sql"
    if [ -f "$MIGRATION_SQL" ]; then
      log "Applying referral migration (fix unique constraint)..."
      mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"         < "$MIGRATION_SQL" 2>/dev/null && log "Referral migration applied"         || warn "Referral migration skipped (may already be applied)"
    fi
  fi
fi

# ================================================================
# STEP 4 — Seed
# ================================================================
header "STEP 4 — Seed database"

read -p "Seed dữ liệu mẫu (admin, merchants, giftcodes...)? Chỉ chạy lần đầu (y/n): " do_seed
if [ "$do_seed" = "y" ]; then
  ./node_modules/.bin/tsx src/prisma/seed.ts
  log "Database seeded"
else
  log "Bỏ qua seed"
fi

# ================================================================
# STEP 5 — Build backend
# ================================================================
header "STEP 5 — Build backend"

cd "$BACKEND_DIR"
npm run build
[ -f "dist/index.js" ] || error "Build thất bại: dist/index.js không tồn tại"
log "Backend built → dist/index.js"

# ================================================================
# STEP 6 — Install FRONTEND dependencies & build
# ================================================================
header "STEP 6 — Install & build frontend"

cd "$FRONTEND_DIR"

# Remove non-existent Radix packages (cause 404 on npm install)
npm pkg delete dependencies.@radix-ui/react-badge 2>/dev/null || true
npm pkg delete dependencies.@radix-ui/react-sheet 2>/dev/null || true

npm install --ignore-scripts --legacy-peer-deps
npm run build
[ -d "dist" ] || error "Frontend build thất bại"
log "Frontend built → dist/"

# ================================================================
# STEP 7 — Copy dist to webroot
# ================================================================
header "STEP 7 — Deploy frontend to webroot"

mkdir -p "${ROOT_DIR}/public"
rm -rf "${ROOT_DIR}/public/"*
cp -r "${FRONTEND_DIR}/dist/"* "${ROOT_DIR}/public/"
log "Frontend copied → ${ROOT_DIR}/public/"

# ================================================================
# STEP 8 — Create required directories
# ================================================================
header "STEP 8 — Setup directories"

mkdir -p "${ROOT_DIR}/logs/pm2"
mkdir -p "${ROOT_DIR}/logs/backend"
mkdir -p "${ROOT_DIR}/backups"
mkdir -p "${BACKEND_DIR}/uploads/avatars"
log "Directories ready"

# ================================================================
# STEP 9 — Nginx config
# ================================================================
header "STEP 9 — Nginx config"

cat > "${NGINX_CONF}" << NGINX_EOF
# GreenCash - Generated by deploy.sh $(date)
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    root /www/wwwroot/${DOMAIN}/public;
    index index.html;

    ssl_certificate     /www/server/panel/vhost/cert/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000" always;
    error_page 497 https://\$host\$request_uri;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }

    location /go/ {
        proxy_pass http://127.0.0.1:4000/api/v1/tracking/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files \$uri =404;
    }

    location ~ \.well-known { allow all; }

    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|LICENSE|README) {
        return 404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    access_log ${LOG_DIR}/${DOMAIN}.log;
    error_log  ${LOG_DIR}/${DOMAIN}.error.log;
}
NGINX_EOF

log "Nginx config written: ${NGINX_CONF}"

if nginx -t 2>/dev/null; then
  nginx -s reload
  log "Nginx reloaded"
else
  warn "Nginx config có lỗi — chạy 'nginx -t' để xem chi tiết"
fi

# ================================================================
# STEP 10 — PM2
# ================================================================
header "STEP 10 — PM2 process manager"

cd "$ROOT_DIR"
pm2 delete greencash-api 2>/dev/null || true

pm2 start "${BACKEND_DIR}/dist/index.js" \
  --name "greencash-api" \
  --instances 2 \
  --exec-mode cluster \
  --max-memory-restart 512M \
  --log "${ROOT_DIR}/logs/pm2/api.log" \
  --merge-logs

pm2 save
log "PM2 started: greencash-api"

# ================================================================
# DONE
# ================================================================
header "DEPLOYMENT COMPLETE"
echo ""
echo -e "${GREEN}  Website  :${NC} https://${DOMAIN}"
echo -e "${GREEN}  API Docs :${NC} https://${DOMAIN}/api/v1/docs"
echo -e "${GREEN}  Health   :${NC} curl https://${DOMAIN}/api/v1/health"
echo ""
echo -e "${YELLOW}  Admin login (nếu đã seed):${NC}"
echo "    Email   : admin@greencash.vn"
echo "    Password: Admin@123456"
echo ""
echo -e "${YELLOW}  Lệnh hữu ích:${NC}"
echo "    pm2 status                — xem processes"
echo "    pm2 logs greencash-api    — xem logs realtime"
echo "    pm2 restart greencash-api — restart"
echo "    bash scripts/backup.sh    — backup database"
echo ""
echo -e "${RED}  ⚠️  Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu!${NC}"

