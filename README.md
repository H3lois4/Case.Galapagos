# Por ELAS finance

Webapp do hackathon da Galapagos Capital — case "Iniciativas para incluir mulheres no mercado financeiro com o uso de IA". Educação e capacitação de mulheres que querem entrar, voltar ou migrar para o mercado financeiro, conectando-as a empresas do setor.

Monorepo com dois projetos que fazem deploy independente na Vercel, a partir do mesmo repositório:

| Pasta | Projeto Vercel | Stack |
| --- | --- | --- |
| `frontend/` | `por-elas-web` | Next.js (App Router) + TypeScript + Tailwind + PWA |
| `backend/` | `por-elas-api` | Django + Django REST Framework (serverless) |

> Status: etapa **00-fundacao** concluída (esqueleto do app, design system, navegação, PWA, `/api/health/`). As funcionalidades de produto chegam nas próximas etapas (ver `.kiro/specs/`).

---

## Pré-requisitos

- Node.js 20+ e npm
- Python 3.12+
- Git

---

## Rodando localmente

### Backend (Django)

```bash
cd backend
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# copie o exemplo de variáveis e ajuste se precisar
# (sem DATABASE_URL, o backend usa SQLite local automaticamente)
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

python manage.py migrate
python manage.py runserver
```

API em `http://localhost:8000`. Teste a saúde:

```bash
curl http://localhost:8000/api/health/
# {"status":"ok","db":"ok","time":"..."}
```

Para acessar o Django Admin, crie um superusuário:

```bash
python manage.py createsuperuser
# depois acesse http://localhost:8000/admin/
```

### Frontend (Next.js)

```bash
cd frontend
npm install

# copie o exemplo de variáveis
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux

npm run dev
```

App em `http://localhost:3000` (redireciona para `/aulas`). A tela **Perfil** mostra um selo "API: conectada" quando o backend está no ar — é a prova da integração.

> O service worker do PWA fica **desligado em desenvolvimento** (para não cachear). Ele só entra no build de produção.

---

## Variáveis de ambiente

### `backend/.env.example`

| Variável | Descrição |
| --- | --- |
| `DJANGO_SECRET_KEY` | Chave secreta do Django. Gere uma aleatória para produção. |
| `DJANGO_DEBUG` | `true` em dev, `false` em produção. |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos, separados por vírgula. |
| `DATABASE_URL` | Postgres do Supabase (pooler, porta 6543). Vazio em dev → usa SQLite. |
| `CORS_ALLOWED_ORIGINS` | Origens liberadas no CORS (URL do frontend), separadas por vírgula. |
| `CSRF_TRUSTED_ORIGINS` | Origens confiáveis para CSRF do Admin em produção. |
| `CRON_SECRET` | Segredo compartilhado com a Vercel Cron (usado em etapas futuras). |

### `frontend/.env.example`

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API Django. Dev: `http://localhost:8000`. Produção: URL do `por-elas-api`. |

> Nunca commite `.env` / `.env.local` com valores reais. Só os `*.env.example` ficam versionados.

---

## Deploy na Vercel (dois projetos, mesmo repositório)

Crie **dois** projetos na Vercel apontando para este mesmo repositório do GitHub. A diferença está no **Root Directory** de cada um.

### 1. `por-elas-api` (backend)

1. New Project → importe o repositório `Case.Galapagos`.
2. **Root Directory:** `backend`.
3. **Framework Preset:** Other.
4. Variáveis de ambiente (Settings → Environment Variables):
   - `DJANGO_SECRET_KEY` (chave aleatória)
   - `DJANGO_DEBUG=false`
   - `DJANGO_ALLOWED_HOSTS` (ex.: `por-elas-api.vercel.app`)
   - `DATABASE_URL` (pooler do Supabase, porta 6543)
   - `CORS_ALLOWED_ORIGINS` (URL do `por-elas-web`, ex.: `https://por-elas-web.vercel.app`)
   - `CSRF_TRUSTED_ORIGINS` (ex.: `https://por-elas-api.vercel.app`)
   - `CRON_SECRET` (opcional nesta etapa)
5. Deploy. O build roda `collectstatic` e o `backend/vercel.json` roteia tudo para `config/wsgi.py` (runtime Python).

### 2. `por-elas-web` (frontend)

1. New Project → importe o mesmo repositório.
2. **Root Directory:** `frontend`.
3. **Framework Preset:** Next.js (detectado automaticamente).
4. Variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL do `por-elas-api` (ex.: `https://por-elas-api.vercel.app`)
5. Deploy.

A cada `git push` na `main`, os dois projetos fazem deploy automático.

### Migrações em produção

As migrações **não** rodam durante o request (o backend é serverless). Rode manualmente, apontando para o banco de produção:

```bash
cd backend
# com o DATABASE_URL de produção no ambiente:
DATABASE_URL="postgresql://..." python manage.py migrate
# Windows (PowerShell):
# $env:DATABASE_URL="postgresql://..."; python manage.py migrate
```

### Manter o Supabase ativo

O plano free do Supabase pausa após ~1 semana sem uso. Uma Vercel Cron diária chamando `GET /api/health/` (que toca o banco) mantém o projeto ativo. A configuração da cron entra nas etapas que também usam o `CRON_SECRET`.

---

## Seed de demonstração

O comando `python manage.py seed_demo` será implementado na etapa **08-seed-e-polimento**. Quando existir, a documentação de uso entra aqui.

---

## Estrutura

```
Case.Galapagos/
├── .kiro/
│   ├── steering/        # product, tech, structure, design-system, git, ai
│   └── specs/           # um spec por etapa (00-fundacao, 01-auth-perfis, ...)
├── frontend/            # Next.js (por-elas-web)
│   ├── app/             # App Router: (app)/ com as telas, manifest, sw, offline
│   ├── components/      # UI, navegação, marca, diagnóstico
│   ├── lib/             # cliente da API, helpers
│   ├── public/          # ícones do PWA, marca
│   └── scripts/         # geração de ícones
└── backend/             # Django (por-elas-api)
    ├── config/          # settings, urls, wsgi
    ├── api/             # endpoints técnicos (health)
    └── accounts/ lessons/ careers/ mentorship/ practice/ network/ ai/ seed/
```

---

## Roadmap (specs)

1. `00-fundacao` — base do monorepo, design system, navegação, PWA, health, deploy. ✅
2. `01-auth-perfis` — Supabase Auth, perfis, username, verificação de empresa.
3. `02-aulas` — aulas em vídeo, upload direto para o R2.
4. `03-ia-base` — provedores de LLM, streaming, chat com voz.
5. `04-carreira` — áreas do mercado, PDF, IA de carreira.
6. `05-mentoria` — agenda com concorrência segura, Google Agenda.
7. `06-pratica` — entrevista com IA e simulados.
8. `07-rede` — posts, notícias, carrossel, IA de notícias.
9. `08-seed-e-polimento` — `seed_demo` e revisão final.
