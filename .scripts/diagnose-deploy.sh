#!/usr/bin/env bash
# Diagnóstico do deploy Render + Neon.
set -euo pipefail

API_URL="${API_URL:-https://smart-campus-api.onrender.com}"
WEB_URL="${WEB_URL:-https://smart-campus-web.onrender.com}"
API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

echo "=== Smart Campus — diagnóstico de produção ==="
echo ""

check_url() {
  local label="$1" url="$2"
  local code body
  code="$(curl -s -o /tmp/diag-body.txt -w '%{http_code}' --max-time 90 "$url" || echo "000")"
  body="$(head -c 200 /tmp/diag-body.txt | tr '\n' ' ')"
  echo "[$label] $url"
  echo "  HTTP $code — ${body:0:120}"
  echo ""
  echo "$code"
}

API_CODE="$(check_url "API /health" "${API_URL}/health")"
WEB_CODE="$(check_url "Web" "${WEB_URL}/")"

if [[ -f .env.deploy ]] && grep -q '^DATABASE_URL=' .env.deploy; then
  echo "[Neon] .env.deploy encontrado — BD configurada localmente."
else
  echo "[Neon] .env.deploy em falta — correr: npm run provision:deploy"
fi
echo ""

if [[ "$API_CODE" == "503" ]] && grep -q 'suspend' /tmp/diag-body.txt 2>/dev/null; then
  echo "PROBLEMA: API suspensa no Render (suspend-by-user)."
  echo "  → https://dashboard.render.com → smart-campus-api → Resume Service"
  echo "  → Environment → DATABASE_URL (copiar de .env.deploy)"
  echo ""
fi

if [[ "$WEB_CODE" == "200" ]]; then
  JS="$(curl -sf "${WEB_URL}/" | rg -o 'src="(/assets/[^"]+\.js)"' | head -1 | sed 's/src="//;s/"//')" || true
  if [[ -n "${JS:-}" ]]; then
    BAKED="$(curl -sf "${WEB_URL}${JS}" | rg -o 'https://[^"`]+onrender[^"`]*' | rg -v 'render\.com/images' | head -1)" || true
    if [[ -n "${BAKED:-}" ]]; then
      echo "Frontend compilado com API: ${BAKED}"
      if [[ "$BAKED" != *"${API_URL#https://}"* ]] || [[ "$BAKED" != */api/v1* ]]; then
        echo "PROBLEMA: URL da API no frontend incorrecta."
        echo "  → Render → smart-campus-web → Environment"
        echo "  → Remover VITE_API_BASE_URL manual errado (se existir)"
        echo "  → Garantir API_PUBLIC_HOST = smart-campus-api.onrender.com"
        echo "  → Manual Deploy (rebuild)"
        echo ""
      fi
    fi
  fi
fi

if [[ "$API_CODE" == "200" ]]; then
  echo "API OK. Testar login em ${WEB_URL}/"
  exit 0
fi

echo "Correcção rápida:"
echo "  1. Render → smart-campus-api → Resume + DATABASE_URL + Deploy"
echo "  2. Render → smart-campus-web → corrigir env + Manual Deploy"
echo "  3. npm run verify:deploy"
echo ""
echo "Ou redeploy limpo: https://render.com/deploy?repo=https://github.com/armandocorreia/UniversityCampusSystem"
