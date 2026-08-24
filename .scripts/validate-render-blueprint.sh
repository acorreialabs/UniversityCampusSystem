#!/usr/bin/env bash
# Validação local do render.yaml (sintaxe + campos obrigatórios).
set -euo pipefail

cd "$(dirname "$0")/.."

FILE="${1:-render.yaml}"

if [[ ! -f "$FILE" ]]; then
  echo "Ficheiro não encontrado: $FILE" >&2
  exit 1
fi

export VALIDATE_RENDER_FILE="$FILE"
node <<'NODE'
const fs = require('fs');
const path = process.env.VALIDATE_RENDER_FILE ?? 'render.yaml';
const text = fs.readFileSync(path, 'utf8');

if (!text.includes('smart-campus-api')) throw new Error('serviço smart-campus-api em falta');
if (!text.includes('smart-campus-web')) throw new Error('serviço smart-campus-web em falta');
if (!text.includes('DATABASE_URL')) throw new Error('DATABASE_URL em falta');
if (!text.includes('healthCheckPath')) throw new Error('healthCheckPath em falta');

const services = [...text.matchAll(/^\s*-\s*type:\s*(\S+)/gm)].map((m) => m[1]);
if (!services.includes('web')) throw new Error('nenhum serviço type: web');

console.log(`OK: ${path} — ${services.length} serviço(s) detectado(s)`);
NODE

if [[ -n "${RENDER_API_KEY:-}" ]] && [[ -n "${RENDER_OWNER_ID:-}" ]]; then
  echo "A validar com Render API..."
  HTTP_CODE="$(curl -s -o /tmp/render-validate.json -w '%{http_code}' \
    -X POST "https://api.render.com/v1/blueprints/validate" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -F "ownerId=${RENDER_OWNER_ID}" \
    -F "file=@${FILE}")"
  if [[ "$HTTP_CODE" != "200" ]]; then
    cat /tmp/render-validate.json >&2
    echo "Validação Render API falhou (HTTP ${HTTP_CODE})." >&2
    exit 1
  fi
  if command -v jq >/dev/null 2>&1; then
    VALID="$(jq -r '.valid // empty' /tmp/render-validate.json)"
    if [[ "$VALID" != "true" ]]; then
      cat /tmp/render-validate.json >&2
      exit 1
    fi
    echo "OK: Render API valid=true"
  else
    echo "OK: Render API HTTP 200 (instale jq para ver detalhes)"
  fi
fi
