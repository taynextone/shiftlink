#!/usr/bin/env bash
# Shiftlink DB-Backup: pg_dump des laufenden Postgres in backups/ mit Datum.
# Aufruf: ./scripts/backup-db.sh          (manuell oder via cron)
# Aufbewahrung: 14 Tage, aeltere Backups werden automatisch geloescht.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="backups"
KEEP_DAYS=14
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/shiftlink_$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Zugangsdaten aus docker-compose / .env (DB_USER/DB_PASSWORD falls gesetzt)
docker compose exec -T db pg_dump -U shiftlink -d shiftlink | gzip > "$FILE"

# Alte Backups aufraeumen
find "$BACKUP_DIR" -name "shiftlink_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "✅ Backup erstellt: $FILE ($(du -h "$FILE" | cut -f1))"
