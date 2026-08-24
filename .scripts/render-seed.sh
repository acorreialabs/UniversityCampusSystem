#!/usr/bin/env bash
# Seed manual — correr uma vez após o primeiro deploy (Render Shell ou local com DATABASE_URL de produção).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL é obrigatório." >&2
  exit 1
fi

npm run db:generate
npm run db:seed

echo "Seed concluído."
