#!/usr/bin/env bash
# Build do frontend para Render (Static Site).
# VITE_API_BASE_URL: URL completa (ex.: https://api.onrender.com/api/v1)
# API_PUBLIC_HOST: hostname da API (Render fromService) — usado se VITE_API_BASE_URL não estiver definido.
set -euo pipefail
cd "$(dirname "$0")/.."

resolve_api_url() {
  if [[ -n "${VITE_API_BASE_URL:-}" ]]; then
    echo "$VITE_API_BASE_URL"
    return
  fi
  if [[ -n "${API_PUBLIC_HOST:-}" ]]; then
    echo "https://${API_PUBLIC_HOST}/api/v1"
    return
  fi
  echo "Defina VITE_API_BASE_URL ou API_PUBLIC_HOST." >&2
  exit 1
}

export VITE_API_BASE_URL="$(resolve_api_url)"

npm install
npm run build -w @smart-campus/shared-types
npm run build -w @smart-campus/validation
npm run build -w @smart-campus/api-client
npm run build -w @smart-campus/web

echo "Frontend build OK — VITE_API_BASE_URL=${VITE_API_BASE_URL}"
