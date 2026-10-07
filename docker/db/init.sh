#!/bin/sh
# Dijalankan otomatis oleh image postgres HANYA saat volume database masih kosong.
set -e
for f in /supabase/migrations/*.sql; do
  echo "migrasi: $f"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q -f "$f"
done
echo "data awal: /supabase/seed.sql"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q -f /supabase/seed.sql > /dev/null
