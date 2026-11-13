#!/bin/bash
# ================================================================
# GreenCash - Rebuild Script
# Dùng khi: sửa code, sửa SQL, thêm migration
# Usage: bash scripts/rebuild.sh [options]
#
# Options:
#   --backend-only   Chỉ rebuild backend
#   --frontend-only  Chỉ rebuild frontend
#   --migrate        Chạy prisma migrate deploy
#   --sql            Chạy tất cả file .sql trong migrations/manual/
#   --seed           Chạy seed lại (cẩn thận: chỉ dùng khi cần)
#   --no-pm2         Không restart PM2
#   --help           Hiển thị hướng dẫn
#
# Ví dụ:
#   bash scripts/rebuild.sh                    # rebuild cả hai
#   bash scripts/rebuild.sh --backend-only     # chỉ backend + restart PM2
#   bash scripts/rebuild.sh --migrate          # migrate DB rồi rebuild
#   bash scripts/rebuild.sh --sql --backend-only
# ================================================================

set -e

DOMAIN="cashback.v3vn.eu"
ROOT_DIR="/www/wwwroot/${DOMAIN}"
BACKEND_DIR="${ROOT_DIR}/apps/backend"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"
LOG_DIR="${ROOT_DIR}/logs"
MANUAL_SQL_DIR="${BACKEND_DIR}/src/prisma/migrations/manual"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()     { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()    { echo -e "${CYAN}[→]${NC} $1"; }
header()  { echo -e "\n${BOLD}${GREEN}▶ $1${NC}"; echo -e "${GREEN}$(printf '─%.0s' {1..50})${NC}"; }
timer_start() { TIMER_START=$(date +%s); }
timer_end()   {
  local elapsed=$(( $(date +%s) - TIMER_START ))
  echo -e "${CYAN}   ⏱ ${elapsed}s${NC}"
}

# ─── Parse arguments ──────────────────────────────────────────────────────────

DO_BACKEND=true
DO_FRONTEND=true
DO_MIGRATE=false
DO_SQL=false
DO_SEED=false
DO_PM2=true

for arg in "$@"; do
  case $arg in
    --backend-only)   DO_FRONTEND=false ;;
    --frontend-only)  DO_BACKEND=false; DO_PM2=false ;;
    --migrate)        DO_MIGRATE=true ;;
    --sql)            DO_SQL=true ;;
    --seed)           DO_SEED=true ;;
    --no-pm2)         DO_PM2=false ;;
    --help|-h)
      echo ""
      echo -e "${BOLD}GreenCash Rebuild Script${NC}"
      echo ""
      echo "Usage: bash scripts/rebuild.sh [options]"
      echo ""
      echo "Options:"
      echo "  --backend-only    Chỉ rebuild backend (nhanh hơn khi chỉ sửa API)"
      echo "  --frontend-only   Chỉ rebuild frontend (nhanh hơn khi chỉ sửa UI)"
      echo "  --migrate         Chạy prisma migrate deploy trước khi build"
      echo "  --sql             Chạy tất cả .sql trong migrations/manual/ theo thứ tự"
      echo "  --seed            Chạy seed lại (CẢNH BÁO: chỉ dùng trên DB rỗng)"
      echo "  --no-pm2          Không restart PM2 (hữu ích khi debug)"
      echo "  --help            Hiển thị hướng dẫn này"
      echo ""
      echo "Ví dụ thường dùng:"
      echo "  bash scripts/rebuild.sh                     # full rebuild"
      echo "  bash scripts/rebuild.sh --backend-only      # chỉ sửa backend"
      echo "  bash scripts/rebuild.sh --frontend-only     # chỉ sửa UI"
      echo "  bash scripts/rebuild.sh --migrate           # có thêm migration mới"
      echo "  bash scripts/rebuild.sh --sql --backend-only # chạy SQL thủ công rồi build"
      echo ""
      exit 0
      ;;
    *)
      warn "Tham số không nhận ra: $arg (chạy --help để xem hướng dẫn)"
      ;;
  esac
done

# ─── Sanity checks ────────────────────────────────────────────────────────────

cd "$ROOT_DIR" || error "Không tìm thấy $ROOT_DIR"

[ -d "$BACKEND_DIR" ]  || error "Không tìm thấy apps/backend/"
[ -d "$FRONTEND_DIR" ] || error "Không tìm thấy apps/frontend/"
[ -f "${BACKEND_DIR}/.env" ] || error ".env không tồn tại. Chạy deploy.sh trước."

# ─── Header ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║     GreenCash Rebuild — $(date '+%H:%M:%S %d/%m/%Y')     ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
[ "$DO_BACKEND"  = "true" ] && _s="${GREEN}✓${NC}" || _s="${YELLOW}skip${NC}"; echo -e "  Backend  : $_s"
[ "$DO_FRONTEND" = "true" ] && _s="${GREEN}✓${NC}" || _s="${YELLOW}skip${NC}"; echo -e "  Frontend : $_s"
[ "$DO_MIGRATE"  = "true" ] && _s="${GREEN}✓${NC}" || _s="-"; echo -e "  Migrate  : $_s"
[ "$DO_SQL"      = "true" ] && _s="${GREEN}✓${NC}" || _s="-"; echo -e "  SQL      : $_s"
[ "$DO_PM2"      = "true" ] && _s="${GREEN}✓${NC}" || _s="${YELLOW}skip${NC}"; echo -e "  PM2      : $_s"
echo ""

REBUILD_START=$(date +%s)

# ─── Load DB connection from .env ─────────────────────────────────────────────

get_db_conn() {
  local DB_URL
  DB_URL=$(grep "^DATABASE_URL=" "${BACKEND_DIR}/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -z "$DB_URL" ]; then
    warn "Không đọc được DATABASE_URL từ .env"
    return 1
  fi
  DB_USER=$(echo "$DB_URL" | sed 's|mysql://||' | cut -d':' -f1)
  DB_PASS=$(echo "$DB_URL" | sed 's|mysql://[^:]*:||' | cut -d'@' -f1)
  DB_HOST=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f1)
  DB_PORT=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f2 | cut -d'/' -f1)
  DB_NAME=$(echo "$DB_URL" | rev | cut -d'/' -f1 | rev | cut -d'?' -f1)
  DB_PORT=${DB_PORT:-3306}
  export DB_USER DB_PASS DB_HOST DB_PORT DB_NAME
}

run_mysql() {
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" "$@"
}

# ─── STEP 1: Prisma migrate ───────────────────────────────────────────────────

if [ "$DO_MIGRATE" = "true" ]; then
  header "Prisma Migrate"
  timer_start

  cd "$BACKEND_DIR"
  PRISMA="./node_modules/.bin/prisma"
  SCHEMA="src/prisma/schema.prisma"

  [ -f "$PRISMA" ] || error "Prisma binary không tìm thấy. Chạy: cd apps/backend && npm install --legacy-peer-deps"
  [ -f "$SCHEMA" ] || error "Schema không tìm thấy: $SCHEMA"

  info "Generating Prisma client..."
  $PRISMA generate --schema="$SCHEMA"

  info "Running migrate deploy..."
  $PRISMA migrate deploy --schema="$SCHEMA"

  log "Prisma migrate hoàn tất"
  timer_end
  cd "$ROOT_DIR"
fi

# ─── STEP 2: Run manual SQL files ─────────────────────────────────────────────

if [ "$DO_SQL" = "true" ]; then
  header "Manual SQL Migrations"
  timer_start

  get_db_conn || error "Không thể kết nối DB"

  # Look in migrations/manual/ for .sql files, sorted by name
  if [ ! -d "$MANUAL_SQL_DIR" ]; then
    mkdir -p "$MANUAL_SQL_DIR"
    warn "Thư mục migrations/manual/ trống. Đặt file .sql vào: $MANUAL_SQL_DIR"
  fi

  SQL_FILES=$(find "$MANUAL_SQL_DIR" -name "*.sql" | sort 2>/dev/null)

  if [ -z "$SQL_FILES" ]; then
    warn "Không có file .sql nào trong migrations/manual/"
  else
    for sql_file in $SQL_FILES; do
      filename=$(basename "$sql_file")
      info "Chạy $filename ..."
      if run_mysql < "$sql_file" 2>/tmp/sql_err; then
        log "$filename — OK"
      else
        err_msg=$(cat /tmp/sql_err)
        # Ignore "duplicate" errors (index already exists, column already added)
        if echo "$err_msg" | grep -qiE "Duplicate|already exists|Can't DROP"; then
          warn "$filename — Bỏ qua (đã apply trước đó)"
        else
          error "$filename — LỖI: $err_msg"
        fi
      fi
    done
  fi

  timer_end
fi

# ─── STEP 3: Seed (optional, dangerous) ──────────────────────────────────────

if [ "$DO_SEED" = "true" ]; then
  header "Seed Database"
  echo -e "${RED}⚠️  CẢNH BÁO: Seed có thể ghi đè dữ liệu hiện có!${NC}"
  read -p "Bạn chắc chắn muốn seed? (yes/n): " seed_confirm
  if [ "$seed_confirm" = "yes" ]; then
    cd "$BACKEND_DIR"
    [ -f "node_modules/.bin/tsx" ] || error "tsx không tìm thấy. Chạy npm install trước."
    ./node_modules/.bin/tsx src/prisma/seed.ts
    log "Seed hoàn tất"
    cd "$ROOT_DIR"
  else
    log "Bỏ qua seed"
  fi
fi

# ─── STEP 4: Build backend ────────────────────────────────────────────────────

if [ "$DO_BACKEND" = "true" ]; then
  header "Build Backend"
  timer_start

  cd "$BACKEND_DIR"

  [ -d "node_modules" ] || {
    info "node_modules chưa có, đang cài dependencies..."
    npm install --ignore-scripts --legacy-peer-deps
  }

  [ -f "node_modules/.bin/prisma" ] && {
    info "Generating Prisma client..."
    ./node_modules/.bin/prisma generate --schema=src/prisma/schema.prisma 2>/dev/null || true
  }

  info "TypeScript compile..."
  npm run build

  [ -f "dist/index.js" ] || error "Build thất bại: dist/index.js không tồn tại"
  log "Backend built → dist/index.js"
  timer_end

  cd "$ROOT_DIR"
fi

# ─── STEP 5: Build frontend ───────────────────────────────────────────────────

if [ "$DO_FRONTEND" = "true" ]; then
  header "Build Frontend"
  timer_start

  cd "$FRONTEND_DIR"

  [ -d "node_modules" ] || {
    info "node_modules chưa có, đang cài dependencies..."
    npm install --ignore-scripts --legacy-peer-deps
  }

  info "Vite build..."
  npm run build

  [ -d "dist" ] || error "Frontend build thất bại: dist/ không tồn tại"
  log "Frontend built → dist/"

  info "Deploying to webroot..."
  mkdir -p "${ROOT_DIR}/public"
  rm -rf "${ROOT_DIR}/public/"*
  cp -r dist/* "${ROOT_DIR}/public/"
  log "Copied → ${ROOT_DIR}/public/"
  timer_end

  cd "$ROOT_DIR"
fi

# ─── STEP 6: Restart PM2 ─────────────────────────────────────────────────────

if [ "$DO_PM2" = "true" ] && [ "$DO_BACKEND" = "true" ]; then
  header "Restart PM2"
  timer_start

  if pm2 describe greencash-api > /dev/null 2>&1; then
    pm2 restart greencash-api
    log "greencash-api restarted"
  else
    warn "Process 'greencash-api' chưa có, đang start..."
    pm2 start "${BACKEND_DIR}/dist/index.js" \
      --name "greencash-api" \
      --instances 2 \
      --exec-mode cluster \
      --max-memory-restart 512M \
      --log "${LOG_DIR}/pm2/api.log" \
      --merge-logs
    pm2 save
    log "greencash-api started"
  fi

  timer_end

  # Show PM2 status
  echo ""
  pm2 list
fi

# ─── Done ────────────────────────────────────────────────────────────────────

TOTAL=$(( $(date +%s) - REBUILD_START ))
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         ✅  Rebuild hoàn tất             ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Tổng thời gian : ${BOLD}${TOTAL}s${NC}"
echo -e "  Website        : https://${DOMAIN}"
echo -e "  API logs       : ${CYAN}pm2 logs greencash-api${NC}"
echo ""

