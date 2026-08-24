#!/usr/bin/env bash
# Provisionamento completo: Neon → migrações/seed → instruções Render
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-.env.deploy}"
REPO_URL="${REPO_URL:-https://github.com/armandocorreia/UniversityCampusSystem}"
RENDER_DEPLOY_URL="https://render.com/deploy?repo=${REPO_URL}"

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  if [[ -z "${NEON_API_KEY:-}" ]]; then
    echo "Ficheiro ${DEPLOY_ENV_FILE} não existe. Defina NEON_API_KEY e volte a correr." >&2
    exit 1
  fi
  bash .scripts/provision-neon.sh
fi

# shellcheck disable=SC1090
source "$DEPLOY_ENV_FILE"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL em falta em ${DEPLOY_ENV_FILE}." >&2
  exit 1
fi

echo "A aplicar migrações Prisma no Neon..."
npm run db:generate
npx prisma migrate deploy

echo "A semear dados de demonstração..."
npm run db:seed

echo ""
echo "════════════════════════════════════════════════════════════"
echo " Base de dados Neon pronta (migrações + seed)."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Abrir Deploy to Render (conta gratuita):"
echo "   ${RENDER_DEPLOY_URL}"
echo ""
echo "2. Quando o Render pedir DATABASE_URL, colar:"
echo ""
echo "   ${DATABASE_URL}"
echo ""
echo "3. Confirmar Apply / Create services."
echo ""
echo "4. Após ~5–10 min, verificar:"
echo "   bash .scripts/verify-deploy.sh"
echo ""
echo "   Ou manualmente:"
echo "   curl https://smart-campus-api.onrender.com/health"
echo "   https://smart-campus-web.onrender.com/"
echo ""

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$DATABASE_URL" | pbcopy
  echo "(DATABASE_URL copiado para a área de transferência)"
fi

if [[ "${OPEN_RENDER:-}" == "true" ]] && command -v open >/dev/null 2>&1; then
  open "$RENDER_DEPLOY_URL"
fi
