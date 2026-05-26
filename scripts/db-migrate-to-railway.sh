#!/usr/bin/env bash
# Neon → Railway PostgreSQL 移行ヘルパー
# 詳細は docs/db_migration_neon_to_railway.md を参照
#
# 使い方:
#   bash scripts/db-migrate-to-railway.sh dump <source-url>
#     → ./neon-dump.dump を出力（pg_dump -Fc）
#   bash scripts/db-migrate-to-railway.sh restore <target-url>
#     → ./neon-dump.dump を target に流し込む（pg_restore --no-owner --no-acl）
#   bash scripts/db-migrate-to-railway.sh verify <url>
#     → \dt と行数を表示

set -euo pipefail

DUMP_FILE="./neon-dump.dump"
SUBCOMMAND="${1:-}"

usage() {
  echo "Usage: $0 <dump|restore|verify> <db-url>" >&2
  exit 1
}

require_psql_tools() {
  for cmd in pg_dump pg_restore psql; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "ERROR: $cmd not found. Install PostgreSQL client tools (e.g. brew install postgresql@16)." >&2
      exit 1
    fi
  done
}

case "$SUBCOMMAND" in
  dump)
    require_psql_tools
    SRC="${2:-}"
    [[ -z "$SRC" ]] && usage
    echo "Dumping from source DB to $DUMP_FILE..."
    pg_dump \
      --no-owner \
      --no-acl \
      --format=custom \
      --file="$DUMP_FILE" \
      "$SRC"
    SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    echo "Dump complete: $DUMP_FILE ($SIZE)"
    ;;
  restore)
    require_psql_tools
    DST="${2:-}"
    [[ -z "$DST" ]] && usage
    if [[ ! -f "$DUMP_FILE" ]]; then
      echo "ERROR: $DUMP_FILE not found. Run 'dump' first." >&2
      exit 1
    fi
    echo "Ensuring pg_trgm extension on target..."
    psql "$DST" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    echo "Restoring $DUMP_FILE to target DB..."
    pg_restore \
      --no-owner \
      --no-acl \
      --dbname="$DST" \
      "$DUMP_FILE"
    echo "Restore complete. Next: update .env DATABASE_URL and run 'npx prisma migrate deploy'."
    ;;
  verify)
    require_psql_tools
    URL="${2:-}"
    [[ -z "$URL" ]] && usage
    echo "Tables:"
    psql "$URL" -c "\dt"
    echo
    echo "Row counts:"
    psql "$URL" -c "SELECT 'universities' AS table, COUNT(*) FROM universities
                    UNION ALL SELECT 'labs', COUNT(*) FROM labs
                    UNION ALL SELECT 'works', COUNT(*) FROM works
                    UNION ALL SELECT 'grants', COUNT(*) FROM grants
                    UNION ALL SELECT 'lab_reports', COUNT(*) FROM lab_reports;"
    ;;
  *)
    usage
    ;;
esac
