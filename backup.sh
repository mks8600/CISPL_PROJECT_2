#!/bin/bash
# CISPL Database Backup Script
# Runs daily via cron: 0 2 * * * /home/deploy/cispl-project/backup.sh

BACKUP_DIR="/home/deploy/backups/cispl"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "Starting CISPL backup: $DATE"

# Dump PostgreSQL database
docker exec cispl-project-db-1 pg_dump -U cispl_user cispl_db | gzip > "$BACKUP_DIR/cispl_db_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created: cispl_db_$DATE.sql.gz"
else
    echo "❌ Database backup FAILED"
    exit 1
fi

# Keep only last 14 days of backups
find "$BACKUP_DIR" -name "*.gz" -mtime +14 -delete
echo "🧹 Old backups cleaned (keeping last 14 days)"

echo "Backup completed: $DATE"
