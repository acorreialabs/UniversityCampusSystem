#!/usr/bin/env bash
# Cria projecto PostgreSQL gratuito no Neon e grava DATABASE_URL em .env.deploy
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT_NAME="${NEON_PROJECT_NAME:-smart-campus-core}"
REGION="${NEON_REGION:-aws-eu-central-1}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-.env.deploy}"

if [[ -z "${NEON_API_KEY:-}" ]]; then
  ORG_FLAG=()
  if [[ -n "${NEON_ORG_ID:-}" ]]; then
    ORG_FLAG=(--org-id "$NEON_ORG_ID")
  elif npx --yes neonctl@latest me --output json 2>/dev/null | jq -e '.organizations[0].id' >/dev/null 2>&1; then
    ORG_FLAG=(--org-id "$(npx --yes neonctl@latest me --output json | jq -r '.organizations[0].id')")
  else
    cat >&2 <<'EOF'
NEON_API_KEY em falta e sessão Neon CLI não detectada.

Opção A — API key: https://console.neon.tech/app/settings/api-keys
  export NEON_API_KEY="..."

Opção B — Sessão CLI (já fez neon auth):
  export NEON_ORG_ID="org-..."   # ex.: org-spring-sunset-94588410
EOF
    exit 1
  fi
else
  ORG_FLAG=()
  if [[ -n "${NEON_ORG_ID:-}" ]]; then
    ORG_FLAG=(--org-id "$NEON_ORG_ID")
  fi
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq é necessário (brew install jq)." >&2
  exit 1
fi

echo "A criar projecto Neon «${PROJECT_NAME}» (${REGION})..."

CREATE_JSON="$(npx --yes neonctl@latest projects create \
  --name "$PROJECT_NAME" \
  --region-id "$REGION" \
  "${ORG_FLAG[@]}" \
  $([[ -n "${NEON_API_KEY:-}" ]] && echo --api-key "$NEON_API_KEY") \
  --output json)"

PROJECT_ID="$(echo "$CREATE_JSON" | jq -r '.project.id // .id // empty')"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Falha ao criar projecto Neon:" >&2
  echo "$CREATE_JSON" >&2
  exit 1
fi

NEON_CS_ARGS=(connection-string main --project-id "$PROJECT_ID" --prisma "${ORG_FLAG[@]}")
[[ -n "${NEON_API_KEY:-}" ]] && NEON_CS_ARGS+=(--api-key "$NEON_API_KEY")

DATABASE_URL="$(npx --yes neonctl@latest "${NEON_CS_ARGS[@]}")"

if [[ -z "$DATABASE_URL" ]]; then
  echo "Não foi possível obter connection string." >&2
  exit 1
fi

if [[ "$DATABASE_URL" == *'?'* ]]; then
  DATABASE_URL="${DATABASE_URL}&schema=public"
else
  DATABASE_URL="${DATABASE_URL}?schema=public"
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
