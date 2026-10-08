#!/usr/bin/env bash
# Membuat ulang database lokal (Postgres biasa, tanpa Supabase) untuk pengembangan & tes.
# Pemakaian: DATABASE_URL=postgres://postgres:postgres@localhost:5432/newagung bash supabase/local/reset.sh
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/newagung}"
DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"
ADMIN_URL="${DATABASE_URL%/*}/postgres"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

psql "$ADMIN_URL" -q -v ON_ERROR_STOP=1 -c "drop database if exists \"$DB_NAME\" with (force);" -c "create database \"$DB_NAME\";"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "create table schema_migrations (name text primary key, applied_at timestamptz not null default now())"
for f in "$DIR"/migrations/*.sql; do
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$f"
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "insert into schema_migrations (name) values ('$(basename "$f")')"
done
if [ "${SKIP_SEED:-0}" != "1" ]; then
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$DIR/seed.sql" > /dev/null
fi
echo "Database $DB_NAME siap."
