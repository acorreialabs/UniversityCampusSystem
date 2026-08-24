# Deploy gratuito — Smart Campus Core

> **Stack recomendada:** [Neon](https://neon.tech) (PostgreSQL) + [Render](https://render.com) (API + frontend estático)  
> **Custo:** 0 € no plano free (com limitações descritas abaixo)  
> **Repositório:** https://github.com/armandocorreia/UniversityCampusSystem

Este guia publica o sistema a partir do GitHub sem servidor próprio. O repositório inclui um **Blueprint Render** (`render.yaml`) que cria automaticamente a API e o frontend.

---

## 0. Setup automático (recomendado)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/armandocorreia/UniversityCampusSystem)

### Comando único (Neon + migrações + seed)

```bash
cp .env.deploy.example .env.deploy
# 1. Obter NEON_API_KEY em https://console.neon.tech/app/settings/api-keys
# 2. Colar em .env.deploy
export $(grep -v '^#' .env.deploy | grep -v '^$' | xargs)
npm run provision:deploy
```

O script:

1. Cria projecto **Neon** gratuito (`smart-campus-core`)
2. Aplica **migrações** e **seed** (utilizadores demo)
3. Mostra o link **Deploy to Render** e copia `DATABASE_URL` (macOS)

Depois:

1. Clicar no botão Render (ou abrir o link impresso)
2. Ligar conta GitHub → colar **`DATABASE_URL`** quando pedido → **Apply**
3. Aguardar build (~5–10 min) → verificar:

```bash
npm run verify:deploy
```

| Script npm | Descrição |
| --- | --- |
| `npm run provision:neon` | Só criar BD Neon |
| `npm run provision:deploy` | Neon + migrate + seed + instruções Render |
| `npm run verify:deploy` | Testar `/health` e frontend |
| `npm run validate:render` | Validar `render.yaml` |

---

## 1. Arquitectura em produção

```text
GitHub (main) ──auto-deploy──► Render
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            smart-campus-api            smart-campus-web
            (Node / Web Service)        (Static Site / nginx)
                    │                           │
                    └───────────┬───────────────┘
                                ▼
                         Neon PostgreSQL
                         (DATABASE_URL)
```

| Componente | Serviço | URL exemplo |
| --- | --- | --- |
| Base de dados | Neon | `postgresql://...@...neon.tech/neondb?sslmode=require` |
| API | Render Web Service | `https://smart-campus-api.onrender.com` |
| Frontend | Render Static Site | `https://smart-campus-web.onrender.com` |

---

## 2. Pré-requisitos

- Conta GitHub com acesso ao repositório (fork ou upstream)
- Conta gratuita [Neon](https://neon.tech)
- Conta gratuita [Render](https://render.com)
- Node.js 22 local (opcional — só para seed manual ou testes)

---

## 3. Passo 1 — PostgreSQL no Neon

1. Entrar em [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Região: escolher a mais próxima (ex.: `Europe` ou `Asia`).
3. Versão PostgreSQL: **16** (compatível com o projecto).
4. Copiar a **connection string** (modo *Pooled* ou *Direct* — ambos funcionam com Prisma).
5. Garantir que inclui SSL:
   ```text
   postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
   ```
6. Guardar — será o `DATABASE_URL` no Render.

> **Nota:** o plano free do Neon suspende a BD após inactividade; o primeiro pedido pode demorar alguns segundos a “acordar”.

---

## 4. Passo 2 — Blueprint no Render

### 4.1 Criar serviços a partir do GitHub

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Ligar a conta GitHub e seleccionar o repositório `UniversityCampusSystem`.
3. Render detecta o ficheiro `render.yaml` na raiz e propõe dois serviços:
   - `smart-campus-api` (Web Service, Node, plano free)
   - `smart-campus-web` (Static Site)
4. Na configuração do Blueprint, definir manualmente:
   - **`DATABASE_URL`** → colar a connection string do Neon
5. Confirmar **Apply**.

O Render gera automaticamente `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`, e liga:

- `CORS_ORIGIN` da API → hostname do frontend
- `API_PUBLIC_HOST` do frontend → hostname da API (build com `VITE_API_BASE_URL` correcto)

### 4.2 O que o Blueprint executa

| Serviço | Build | Start / publicação |
| --- | --- | --- |
| API | `.scripts/render-build-api.sh` | `.scripts/render-start-api.sh` (`migrate deploy` + Node) |
| Web | `.scripts/render-build-web.sh` | publica `apps/web/dist` |

Ficheiros relevantes no repo:

- [`render.yaml`](../render.yaml) — definição Blueprint
- [`.scripts/render-build-api.sh`](../.scripts/render-build-api.sh)
- [`.scripts/render-build-web.sh`](../.scripts/render-build-web.sh)
- [`.scripts/render-start-api.sh`](../.scripts/render-start-api.sh)
- [`.scripts/render-seed.sh`](../.scripts/render-seed.sh)

### 4.3 Deploy manual (sem Blueprint)

Se preferir criar serviços um a um no painel Render:

**API (Web Service)**

| Campo | Valor |
| --- | --- |
| Build Command | `bash .scripts/render-build-api.sh` |
| Start Command | `bash .scripts/render-start-api.sh` |
| Health Check Path | `/health` |

**Web (Static Site)**

| Campo | Valor |
| --- | --- |
| Build Command | `bash .scripts/render-build-web.sh` |
| Publish Directory | `apps/web/dist` |

Definir `VITE_API_BASE_URL=https://<host-da-api>/api/v1` no serviço web (ou `API_PUBLIC_HOST` = hostname da API).

---

## 5. Passo 3 — Seed (dados de demonstração)

O arranque da API **não** corre o seed por defeito (evita trabalho desnecessário em cada restart).

**Uma vez**, após o primeiro deploy com sucesso:

### Opção A — Render Shell (recomendada)

1. Painel Render → serviço `smart-campus-api` → **Shell**.
2. Executar:
   ```bash
   bash .scripts/render-seed.sh
   ```

### Opção B — Localmente (com DATABASE_URL de produção)

```bash
export DATABASE_URL="postgresql://..."   # Neon
bash .scripts/render-seed.sh
```

### Opção C — Seed no arranque (temporário)

No serviço API, adicionar variável de ambiente:

```text
RUN_DB_SEED=true
```

Remover depois do primeiro deploy bem-sucedido. O seed usa `upsert` e é idempotente, mas não é necessário em cada restart.

---

## 6. Passo 4 — Verificação

Substituir pelos URLs reais do Render:

| Teste | URL | Resultado esperado |
| --- | --- | --- |
| Health | `https://smart-campus-api.onrender.com/health` | `{ "status": "ok" }` |
| Swagger | `https://smart-campus-api.onrender.com/api/docs` | UI Swagger |
| Login UI | `https://smart-campus-web.onrender.com/` | Página de login |

**Credenciais demo** (após seed):

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@smartcampus.demo | Admin123! |
| COORDINATOR | coordenador@smartcampus.demo | Coord123! |
| TEACHER | docente@smartcampus.demo | Docente123! |
| TECHNICIAN | tecnico@smartcampus.demo | Tecnico123! |
| STUDENT | estudante@smartcampus.demo | Estudante123! |

---

## 7. Deploy contínuo a partir do GitHub

Com o Blueprint aplicado, cada **push/merge na `main`** dispara novo build nos dois serviços Render.

O repositório mantém **CI no GitHub Actions** (`.github/workflows/ci.yml`) — testes antes de merge; o Render faz o deploy após o merge.

Fluxo recomendado para grupos:

1. PR para `main` → CI passa → merge
2. Render rebuild automático → API + Web actualizados

---

## 8. Variáveis de ambiente

### API (`smart-campus-api`)

| Variável | Obrigatório | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Connection string Neon |
| `JWT_ACCESS_SECRET` | Sim | ≥ 32 chars (Render gera no Blueprint) |
| `JWT_REFRESH_SECRET` | Sim | ≥ 32 chars (Render gera no Blueprint) |
| `CORS_ORIGIN` | Sim | Host ou URL do frontend (Blueprint preenche) |
| `NODE_ENV` | Sim | `production` |
| `API_HOST` | Sim | `0.0.0.0` |
| `PORT` | Auto | Injectado pelo Render; a API usa-o automaticamente |
| `RUN_DB_SEED` | Não | `true` só para seed no arranque (temporário) |
| `LOG_LEVEL` | Não | `info` (default) |

### Frontend (`smart-campus-web`)

| Variável | Obrigatório | Descrição |
| --- | --- | --- |
| `API_PUBLIC_HOST` | Sim* | Hostname da API (Blueprint) |
| `VITE_API_BASE_URL` | Sim* | URL completa `https://.../api/v1` (alternativa manual) |

\* Um dos dois — o script de build resolve a URL da API.

Ver também [`.env.example`](../.env.example) para desenvolvimento local.

---

## 9. Limitações do plano gratuito

| Limitação | Impacto |
| --- | --- |
| **Cold start (Render)** | API adormece após ~15 min sem tráfego; primeiro pedido pode demorar 30–60 s |
| **Neon suspend** | BD free suspende por inactividade; wake-up automático |
| **RAM (512 MB API)** | Suficiente para demo académica; não para carga elevada |
| **Credenciais demo** | Visíveis neste documento — **não** usar para dados reais |
| **HTTPS** | Render e Neon fornecem TLS; não misturar `http` no frontend |

---

## 10. Resolução de problemas

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| API não arranca | `DATABASE_URL` incorrecto | Verificar string Neon + `?sslmode=require` |
| Login falha / 401 | Seed não corrido | `bash .scripts/render-seed.sh` |
| UI vazia após login | `VITE_API_BASE_URL` errado no build | Rebuild do serviço web; confirmar `API_PUBLIC_HOST` |
| Erro CORS no browser | `CORS_ORIGIN` não coincide com URL do web | Actualizar env da API com URL exacta do frontend |
| Build web falha | API ainda não deployada | Deploy API primeiro; redeploy web |
| `/health` timeout | Cold start | Aguardar e repetir pedido |
| Migrações falham | BD vazia ou versão errada | Logs Render → `prisma migrate deploy` |

**Logs:** Render Dashboard → serviço → **Logs**.

**Teste local do build Render:**

```bash
npm install
bash .scripts/render-build-api.sh
DATABASE_URL="..." bash .scripts/render-start-api.sh
```

```bash
API_PUBLIC_HOST=localhost:4100 bash .scripts/render-build-web.sh
# ou
VITE_API_BASE_URL=http://localhost:4100/api/v1 bash .scripts/render-build-web.sh
```

---

## 11. Alternativa: Docker num VPS gratuito

Para correr `docker compose up` numa VM (ex.: Oracle Cloud Always Free):

```bash
git clone https://github.com/armandocorreia/UniversityCampusSystem.git
cd UniversityCampusSystem
cp .env.example .env
# Editar .env: DATABASE_URL (Neon ou Postgres local), JWT, CORS_ORIGIN
docker compose build \
  --build-arg VITE_API_BASE_URL=https://SEU-DOMINIO-API/api/v1 \
  web
docker compose up -d
docker compose exec api npx tsx prisma/seed.ts
```

Requer abrir portas no firewall e configurar HTTPS (ex.: Caddy ou Nginx + Let’s Encrypt).

---

## 12. Segurança (demo académica)

1. Nunca commitar `.env` com segredos reais.
2. Rotacionar JWT secrets se expostos acidentalmente.
3. Manter credenciais demo apenas para avaliação PTP III.
4. Branch `main` protegida: PR + CI antes de deploy automático.

---

## Documentação relacionada

- [README](../README.md) — instalação local
- [Arquitectura](architecture.md) — secção 13 (infraestrutura)
- [Manual de construção](manual-construcao-core.md)
- [Guia contribuição grupos](guia-contribuicao-grupos.md)
