#!/usr/bin/env bash
# Build da API para Render (Web Service Node).
set -euo pipefail
cd "$(dirname "$0")/.."

# Render define NODE_ENV=production — devDependencies são necessárias para tsc/prisma
npm install --include=dev
npm run db:generate

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERRO: DATABASE_URL não definido no Render (Environment → smart-campus-api)." >&2
  exit 1
fi

echo "A aplicar migrações Prisma (build)..."
npx prisma migrate deploy

npm run build -w @smart-campus/shared-types
npm run build -w @smart-campus/validation
npm run build -w @smart-campus/api

echo "API build OK"
