#!/usr/bin/env bash
# Arranque da API no Render: migrações Prisma + servidor Node.
set -euo pipefail
cd "$(dirname "$0")/.."

npx prisma migrate deploy

if [[ "${RUN_DB_SEED:-}" == "true" ]]; then
  echo "A executar seed (RUN_DB_SEED=true)..."
  npm run db:seed
fi

exec node apps/api/dist/index.js
