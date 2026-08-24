#!/usr/bin/env bash
# Build do frontend para Render (Static Site).
# VITE_API_BASE_URL: URL completa (ex.: https://api.onrender.com/api/v1)
# API_PUBLIC_HOST: hostname da API (Render fromService) — usado se VITE_API_BASE_URL não estiver definido.
set -euo pipefail
cd "$(dirname "$0")/.."

resolve_api_url() {
  local url=""
  if [[ -n "${VITE_API_BASE_URL:-}" ]]; then
    url="$VITE_API_BASE_URL"
  elif [[ -n "${RENDER_EXTERNAL_URL:-}" ]]; then
    url="${RENDER_EXTERNAL_URL}"
  elif [[ -n "${API_PUBLIC_HOST:-}" ]]; then
    url="https://${API_PUBLIC_HOST}"
  else
    echo "Defina VITE_API_BASE_URL, RENDER_EXTERNAL_URL ou API_PUBLIC_HOST." >&2
    exit 1
  fi

  url="${url%/}"
  case "$url" in
    */api/v1) ;;
    */api) url="${url}/v1" ;;
    *) url="${url}/api/v1" ;;
  esac
  echo "$url"
}

export VITE_API_BASE_URL="$(resolve_api_url)"

npm install
npm run build -w @smart-campus/shared-types
npm run build -w @smart-campus/validation
npm run build -w @smart-campus/api-client
npm run build -w @smart-campus/web

echo "Frontend build OK — VITE_API_BASE_URL=${VITE_API_BASE_URL}"
