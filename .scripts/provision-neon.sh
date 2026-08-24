#!/usr/bin/env bash
# Cria projecto PostgreSQL gratuito no Neon e grava DATABASE_URL em .env.deploy
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT_NAME="${NEON_PROJECT_NAME:-smart-campus-core}"
REGION="${NEON_REGION:-aws-eu-central-1}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-.env.deploy}"

if [[ -z "${NEON_API_KEY:-}" ]]; then
  cat >&2 <<'EOF'
NEON_API_KEY em falta.

1. https://console.neon.tech/app/settings/api-keys → Create API key
2. export NEON_API_KEY="..."
3. bash .scripts/provision-neon.sh
EOF
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq é necessário (brew install jq)." >&2
  exit 1
fi

echo "A criar projecto Neon «${PROJECT_NAME}» (${REGION})..."

CREATE_JSON="$(npx --yes neonctl@latest projects create \
  --name "$PROJECT_NAME" \
  --region-id "$REGION" \
  --api-key "$NEON_API_KEY" \
  --output json)"

PROJECT_ID="$(echo "$CREATE_JSON" | jq -r '.project.id // .id // empty')"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Falha ao criar projecto Neon:" >&2
  echo "$CREATE_JSON" >&2
  exit 1
fi

DATABASE_URL="$(npx --yes neonctl@latest connection-string main \
  --project-id "$PROJECT_ID" \
  --prisma \
  --api-key "$NEON_API_KEY" \
  --output json | jq -r '.connection_uri // .connection_string // empty')"

if [[ -z "$DATABASE_URL" ]]; then
  DATABASE_URL="$(npx --yes neonctl@latest connection-string main \
    --project-id "$PROJECT_ID" \
    --prisma \
    --api-key "$NEON_API_KEY")"
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "Não foi possível obter connection string." >&2
  exit 1
fi

cat >"$DEPLOY_ENV_FILE" <<EOF
# Gerado por .scripts/provision-neon.sh — não commitar
NEON_PROJECT_ID=${PROJECT_ID}
NEON_PROJECT_NAME=${PROJECT_NAME}
DATABASE_URL=${DATABASE_URL}
EOF

chmod 600 "$DEPLOY_ENV_FILE" 2>/dev/null || true

echo ""
echo "Neon OK — projecto: ${PROJECT_ID}"
echo "DATABASE_URL guardado em ${DEPLOY_ENV_FILE}"
echo ""
echo "Próximo: bash .scripts/provision-deploy.sh (migra + seed + link Render)"
