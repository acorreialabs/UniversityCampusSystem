#!/usr/bin/env bash
# Verifica deploy Render (health API + frontend).
set -euo pipefail

API_URL="${1:-${API_URL:-https://smart-campus-api.onrender.com}}"
WEB_URL="${2:-${WEB_URL:-https://smart-campus-web.onrender.com}}"

API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

echo "API:  ${API_URL}/health"
echo "Web:  ${WEB_URL}/"
echo ""

FAIL=0

if HEALTH="$(curl -sf --max-time 120 "${API_URL}/health" 2>/dev/null)"; then
  echo "✓ API health: ${HEALTH}"
else
  echo "✗ API indisponível (cold start? aguarde 60s e repita)" >&2
  FAIL=1
fi

WEB_CODE="$(curl -sf -o /dev/null -w '%{http_code}' --max-time 120 "${WEB_URL}/" 2>/dev/null || echo "000")"
if [[ "$WEB_CODE" == "200" ]]; then
  echo "✓ Frontend HTTP ${WEB_CODE}"
else
  echo "✗ Frontend HTTP ${WEB_CODE}" >&2
  FAIL=1
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo ""
  echo "Deploy OK. Login demo: admin@smartcampus.demo / Admin123!"
  exit 0
fi

exit 1
