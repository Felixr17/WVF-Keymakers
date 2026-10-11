#!/usr/bin/env bash
# Restores a backup made by scripts/backup.sh, following the official HumHub Docker
# restore guide. DESTRUCTIVE: replaces the current database and data files.
#   ./scripts/restore.sh backups/humhub_backup_<timestamp>.tar --yes
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

archive="${1:-}"; confirm="${2:-}"
[ -f "$archive" ] || die "usage: scripts/restore.sh <backups/humhub_backup_TIMESTAMP.tar> --yes"
[ "$confirm" = "--yes" ] || die "restore replaces all current data; re-run with --yes to confirm"

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
tar -xf "$archive" -C "$work"
db_dump="$(ls "$work"/humhub_db_*.sql.gz | head -1)"
storage="$(ls "$work"/humhub_storage_backup_*.tar.gz | head -1)"
[ -f "$db_dump" ] && [ -f "$storage" ] || die "archive does not contain the expected database and storage files"

compose down
sudo_rm() { if [ -w "$1" ]; then rm -rf "$1"; else sudo rm -rf "$1"; fi; }
sudo_rm data/mysql
compose up -d db
until compose exec -T db healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; do sleep 2; done
zcat "$db_dump" | compose exec -T db sh -c 'mariadb -u "$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"'

mkdir -p "$work/storage" data/humhub
tar -xzf "$storage" -C "$work/storage"
for dir in config uploads themes modules-custom; do
  src="$work/storage/data/$dir"
  [ -d "$src" ] || continue
  cp -a "$src" data/humhub/ 2>/dev/null || sudo cp -a "$src" data/humhub/
done

compose up -d
echo "Restore complete. Verify sign-in, spaces, uploads, and run scripts/healthcheck.sh."
