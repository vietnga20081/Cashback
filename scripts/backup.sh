#!/bin/bash
# GreenCash - Database Backup Script
# Usage: bash backup.sh
# Recommended: add to crontab for daily backups
#   0 3 * * * /www/wwwroot/greencash.vn/scripts/backup.sh >> /www/wwwroot/greencash.vn/logs/backup.log 2>&1

set -e

# Load environment variables
ENV_FILE="../apps/backend/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

BACKUP_DIR="../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# Parse DATABASE_URL: mysql://user:pass@host:port/dbname
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/mysql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

BACKUP_FILE="$BACKUP_DIR/greencash_${TIMESTAMP}.sql.gz"

echo "🗄️  Backing up database '$DB_NAME'..."

mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Backup uploaded files
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
if [ -d "../apps/backend/uploads" ]; then
    tar -czf "$UPLOADS_BACKUP" -C ../apps/backend uploads
    echo "✅ Uploads backup saved: $UPLOADS_BACKUP"
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup process complete!"
