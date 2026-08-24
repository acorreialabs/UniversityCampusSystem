#!/usr/bin/env bash
# Arranque da API no Render.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERRO: DATABASE_URL em falta. Adicione no Render → Environment." >&2
  exit 1
fi

if [[ ! -f apps/api/dist/index.js ]]; then
  echo "ERRO: apps/api/dist/index.js não encontrado — build falhou?" >&2
  exit 1
fi

if [[ "${RUN_DB_SEED:-}" == "true" ]]; then
  echo "A executar seed (RUN_DB_SEED=true)..."
  npm run db:seed
fi

echo "A arrancar API (PORT=${PORT:-4100})..."
exec node apps/api/dist/index.js
