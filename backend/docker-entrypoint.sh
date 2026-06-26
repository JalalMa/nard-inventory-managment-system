#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
attempt=0
until npm run --silent migration:run:prod; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 10 ]; then
    echo "[entrypoint] Migrations failed after $attempt attempts — aborting."
    exit 1
  fi
  echo "[entrypoint] Database not ready (attempt $attempt). Retrying in 3s..."
  sleep 3
done

echo "[entrypoint] Seeding demo data (idempotent)..."
node dist/database/seeds/seed.js || echo "[entrypoint] Seed step reported an issue — continuing."

echo "[entrypoint] Starting API..."
exec node dist/main
