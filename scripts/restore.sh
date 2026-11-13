#!/bin/bash
# GreenCash - Database Restore Script
# Usage: bash restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "❌ Vui lòng chỉ định file backup"
    echo "Usage: bash restore.sh ../backups/greencash_20240101_030000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File không tồn tại: $BACKUP_FILE"
    exit 1
fi

ENV_FILE="../apps/backend/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_USER=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "⚠️  CẢNH BÁO: Hành động này sẽ XÓA toàn bộ dữ liệu hiện tại của database '$DB_NAME'"
read -p "Bạn có chắc chắn muốn tiếp tục? (yes/no) " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Đã hủy."
    exit 0
fi

echo "🔄 Restoring database from $BACKUP_FILE..."

gunzip < "$BACKUP_FILE" | mysql \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    "$DB_NAME"

echo "✅ Database restored successfully!"
echo "🔄 Restarting backend service..."
pm2 restart greencash-api

echo "✅ Restore complete!"
