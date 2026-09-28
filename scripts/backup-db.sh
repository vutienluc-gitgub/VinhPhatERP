#!/bin/bash
set -e

BACKUP_DIR="/var/backups/vinhphaterp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_FILE="$BACKUP_DIR/vinhphaterp_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting Supabase DB backup..."
docker exec supabase-db pg_dump -U postgres postgres | gzip > "$TARGET_FILE"

FILE_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
echo "[$(date)] Backup completed: $TARGET_FILE ($FILE_SIZE)"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "vinhphaterp_*.sql.gz" -mtime +14 -delete
echo "[$(date)] Old backups older than 14 days purged."
