#!/usr/bin/env bash
# Pulls Neon → a dated dump on this Mac, keeps the newest 14 days, and (if LOCAL_DATABASE_URL is set) restores it into
# the local Postgres mirror that the app's "Local backup" view reads. Neon's free tier only keeps a 6 h restore window.
#
# Usage: make db-backup          (once)
#        make backup-install     (every 15 min via launchd; see scripts/launchd/)
# Restore Neon from a dump:  pg_restore --clean --if-exists --no-owner --no-privileges -d "$DIRECT_URL" <file>
set -euo pipefail
cd "$(dirname "$0")/.."

env_val() { grep -E "^$1=" .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true; }
src="${DATABASE_URL:-$(env_val DATABASE_URL)}"
local_url="${LOCAL_DATABASE_URL:-$(env_val LOCAL_DATABASE_URL)}"
dir="${BACKUP_DIR:-$HOME/.courseit/backups}"
keep="${KEEP:-14}"
[ -n "$src" ] || { echo "DATABASE_URL is not set"; exit 1; }
# pg_dump needs a real session, so use Neon's direct endpoint, not the -pooler one.
direct="${src/-pooler./.}"
# sslmode=verify-full needs a CA file in libpq (node-pg uses the system store itself); "system" = the OS trust store.
# Only for Neon: libpq also forces SSL wherever it is set, which a local mirror usually doesn't speak.
neon_ssl="${PGSSLROOTCERT:-system}"

mkdir -p "$dir"
out="$dir/tubewise-$(date +%F).dump" # one file per day; later runs that day overwrite it
PGSSLROOTCERT="$neon_ssl" pg_dump --format=custom --no-owner --no-privileges --dbname="$direct" --file="$out.partial"
mv "$out.partial" "$out"
ls -1t "$dir"/tubewise-*.dump | tail -n +"$((keep + 1))" | while read -r old; do rm -f "$old"; done
echo "$(date '+%F %T') dumped $(basename "$out") ($(du -h "$out" | cut -f1)), keeping $(ls "$dir"/tubewise-*.dump | wc -l | tr -d ' ')"

if [ -n "$local_url" ]; then
  pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction --dbname="$local_url" "$out"
  echo "$(date '+%F %T') mirrored into the local backup database"
fi
