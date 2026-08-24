#!/usr/bin/env bash
# Checklist pós-deploy — URLs reais do Render.
set -euo pipefail

API_HOST="${1:-smart-campus-api-i6hq.onrender.com}"
WEB_HOST="${2:-smart-campus-web.onrender.com}"
API_URL="https://${API_HOST}"

echo "=== Checklist Smart Campus ==="
echo ""
echo "Render → smart-campus-api → Environment:"
echo "  DATABASE_URL     = (Neon — ver .env.deploy)"
echo "  JWT_ACCESS_SECRET"
echo "  JWT_REFRESH_SECRET"
echo "  CORS_ORIGIN      = https://${WEB_HOST}"
echo ""
echo "Render → smart-campus-web → Environment:"
echo "  APAGAR VITE_API_BASE_URL se apontar para hijp ou /api sem v1"
echo "  API_PUBLIC_HOST  = ${API_HOST}"
echo ""
echo "Testes:"
curl -sf "${API_URL}/health" && echo "  ✓ ${API_URL}/health" || echo "  ✗ ${API_URL}/health — API offline ou deploy pendente"
curl -sf -o /dev/null "${API_URL}/api/docs/" && echo "  ✓ Swagger" || echo "  ✗ Swagger"
curl -sf -o /dev/null "https://${WEB_HOST}/" && echo "  ✓ Frontend" || echo "  ✗ Frontend"
echo ""
echo "Login: https://${WEB_HOST}/"
echo "  admin@smartcampus.demo / Admin123!"
