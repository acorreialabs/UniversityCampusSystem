#!/usr/bin/env bash
# Build da API para Render (Web Service Node).
set -euo pipefail
cd "$(dirname "$0")/.."

# Render define NODE_ENV=production — devDependencies são necessárias para tsc/prisma
npm install --include=dev
npm run db:generate
npm run build -w @smart-campus/shared-types
npm run build -w @smart-campus/validation
npm run build -w @smart-campus/api

echo "API build OK"
