# Por ELAS finance

Webapp do hackathon da Galapagos Capital — case "Iniciativas para incluir mulheres no mercado financeiro com o uso de IA". Educação e capacitação de mulheres que querem entrar, voltar ou migrar para o mercado financeiro, conectando-as a empresas do setor.

Monorepo com dois projetos que fazem deploy independente na Vercel, a partir do mesmo repositório:

| Pasta | Projeto Vercel | Stack |
| --- | --- | --- |
| `frontend/` | `por-elas-web` | Next.js (App Router) + TypeScript + Tailwind + PWA |
| `backend/` | `por-elas-api` | Django + Django REST Framework (serverless) |

> Status: etapas **00-fundacao**, **01-auth-perfis**, **02-aulas**, **03-ia-base** e **04-carreira** concluídas (esqueleto do app, design system, navegação, PWA, `/api/health/`, autenticação Supabase + perfis, aulas em vídeo com upload direto para o R2, a fundação de IA — LLM trocável com streaming e chat por voz — e a tela de Carreira com áreas do mercado, PDF e IA de planejamento). As próximas funcionalidades de produto chegam nas etapas seguintes (ver `.kiro/specs/`).

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

| `SUPABASE_PROJECT_URL` | URL do projeto Supabase (valida o JWT pelas chaves públicas). |
| `SUPABASE_JWT_AUD` | Audiência do JWT (padrão `authenticated`). |
| `SUPABASE_JWKS_TTL` | Cache das chaves públicas, em segundos (padrão 600). |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USE_TLS` | SMTP (o mesmo configurado no Supabase). |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | Usuário e senha do SMTP (senha de app, no caso do Gmail). |
| `DEFAULT_FROM_EMAIL` | Remetente dos e-mails do app. |
| `DOMINIOS_PRE_APROVADOS` | Domínios de empresa que aprovam automaticamente após o código. |
| `TERMOS_VERSAO` | Versão dos termos aceitos no cadastro. |
| `R2_ACCOUNT_ID` | Account ID da Cloudflare (monta o endpoint S3 do R2). |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciais do token S3 do R2 (sensíveis). |
| `R2_BUCKET` | Nome do bucket (ex.: `por-elas-media`). |
| `R2_ENDPOINT` | Endpoint S3 (opcional; derivado do account id se vazio). |
| `R2_PUBLIC_BASE_URL` | URL pública de leitura do bucket (ex.: `https://pub-xxxx.r2.dev`). |
| `UPLOAD_VIDEO_MAX_BYTES` / `UPLOAD_IMG_MAX_BYTES` | Limites de tamanho (padrão 200 MB / 5 MB). |
| `UPLOAD_URL_TTL` / `UPLOAD_VIDEO_MAX_SEG` | Expiração da URL pré-assinada e duração máxima do vídeo. |
| `LLM_PROVIDER` | Provedor de IA: `gemini` (padrão), `openai` ou `anthropic`. |
| `LLM_MODEL` | Modelo usado (padrão `gemini-2.5-flash`). |
| `GEMINI_API_KEY` | Chave do Gemini (Google AI Studio). Obrigatória no provedor padrão. |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Chaves dos provedores alternativos (opcionais). |
| `AI_RATE_LIMIT_PER_HOUR` | Limite de mensagens por usuária por hora (padrão 30). |
| `AI_MAX_HISTORY` | Nº de mensagens recentes enviadas ao modelo (padrão 20). |

### `frontend/.env.example`

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API Django. Dev: `http://localhost:8000`. Produção: URL do `por-elas-api`. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (publishable/anon) do Supabase. |

> Nunca commite `.env` / `.env.local` com valores reais. Só os `*.env.example` ficam versionados.

## Autenticação (Supabase)

A autenticação é do **Supabase Auth** (Google e e-mail + senha). O Django valida o JWT pelas chaves públicas do projeto, sem guardar senhas, e cria o perfil local no primeiro acesso.

Configuração do projeto Supabase (passo a passo completo em `.kiro/specs/01-auth-perfis/SETUP-SUPABASE.md`):

1. Criar o projeto e pegar **Project URL** e **publishable/anon key**.
2. Ativar **JWT Signing Keys assimétricas** (ES256/RS256) — confira em `/auth/v1/.well-known/jwks.json`.
3. Habilitar os provedores **Email** e **Google** (com o redirect `https://SEU-PROJETO.supabase.co/auth/v1/callback` no Google Cloud).
4. Configurar **URL de redirecionamento** (`http://localhost:3000/**` e a URL da Vercel).
5. Configurar **SMTP próprio** (o sender padrão só manda 2 e-mails/hora) e subir o rate limit de e-mail.
6. Pegar a **connection string** do banco pelo **pooler (porta 6543)** para o `DATABASE_URL`.

## Armazenamento de mídia (Cloudflare R2)

As aulas em vídeo (e as capas/thumbnails) ficam no **Cloudflare R2** (compatível com S3, plano gratuito). O upload vai **direto do navegador para o R2** usando uma URL pré-assinada que o Django gera com `boto3` — o arquivo nunca passa pelo backend (as funções serverless têm limite de tamanho de requisição). O player lê o vídeo pela URL pública do bucket.

Passo a passo completo (ativar R2, criar bucket, token S3, bucket público e CORS) em `.kiro/specs/02-aulas/SETUP-R2.md`. Ao final, preencha no `backend/.env`:

- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.

Limites padrão: vídeo até **200 MB** e **10 min** (`video/mp4` ou `video/webm`); capa até **5 MB** (JPG/PNG/WebP). A URL pré-assinada expira em **10 min** e só é gerada para usuárias de **empresa aprovada**.

> Sem as variáveis `R2_*`, a tela de aulas continua funcionando (listagem e player de aulas já cadastradas); apenas o upload responde `503` até configurar o R2.

## IA (LLM trocável)

As IAs do app (assistente, e nas próximas etapas carreira, mentoria e prática) usam um **LLM pronto** — não treinamos modelo. O padrão é o **Gemini Flash** (plano gratuito). O provedor e o modelo são trocáveis por variável de ambiente, sem mexer no código:

```
LLM_PROVIDER=gemini            # gemini | openai | anthropic
LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=...             # gere em https://aistudio.google.com/apikey
```

Como "treinar" a IA sem código:
- **Prompt de sistema** de cada agente em `backend/ai/prompts/<agente>.md`.
- **Base de conhecimento** em `backend/ai/knowledge/<agente>/*.md` (injetada no prompt).
- Editar esses `.md` muda o comportamento do agente. Regras globais (pt-BR, tom acolhedor, não recomendar investimento, não inventar fatos) valem para todos.

Outros pontos:
- As respostas chegam em **streaming (SSE)** pelo endpoint `POST /api/ai/chat/`.
- O frontend tem um **chat único com voz** (Web Speech API): ditar, ouvir a resposta e modo conversa por voz. Teste em **Perfil → Diagnóstico → "Testar assistente de IA"** (`/assistente`).
- **Limite de uso:** `AI_RATE_LIMIT_PER_HOUR` mensagens por usuária por hora (padrão 30), para proteger a cota gratuita.
- Sem `GEMINI_API_KEY`, o chat responde erro claro; o resto do app segue funcionando.

> Crescimento: a busca semântica (RAG com pgvector no Supabase) fica preparada para quando a base de conhecimento crescer; no MVP, o conhecimento é injetado direto no prompt.

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

## Carreira (áreas e IA)

A tela **Carreira** tem um guia das áreas do mercado financeiro e a **IA de carreira** (agente sobre a base da etapa 03).

- **Áreas:** o conteúdo vem de um seed editável em `backend/careers/data/areas.json`. Para popular/atualizar o banco:
  ```bash
  cd backend
  python manage.py seed_areas   # idempotente (upsert por slug; não apaga planos)
  ```
  Para editar uma área (descrição, certificações, skills, mulheres de referência), ajuste o JSON e rode de novo, ou edite direto no Django Admin.
- **Mulheres de referência:** os links de LinkedIn no seed são **placeholders** (`https://www.linkedin.com/`) — troque pelos perfis reais quando tiver.
- **IA de carreira:** prompt em `backend/ai/prompts/carreira.md` e conhecimento em `backend/ai/knowledge/carreira/`. A usuária pode gerar um **plano de carreira** (checklist no Perfil). Depende da `GEMINI_API_KEY` (ver seção de IA).
- **PDF das áreas:** gerado no navegador (jsPDF), com a identidade visual do app.

## Seed de demonstração

O comando `python manage.py seed_demo` será implementado na etapa **08-seed-e-polimento**. Quando existir, a documentação de uso entra aqui. (As áreas de carreira já têm o seed próprio `seed_areas`, acima.)

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
2. `01-auth-perfis` — Supabase Auth, perfis, username, verificação de empresa. ✅
3. `02-aulas` — aulas em vídeo, upload direto para o R2. ✅
4. `03-ia-base` — provedores de LLM, streaming, chat com voz. ✅
5. `04-carreira` — áreas do mercado, PDF, IA de carreira. ✅
6. `05-mentoria` — agenda com concorrência segura, Google Agenda.
7. `06-pratica` — entrevista com IA e simulados.
8. `07-rede` — posts, notícias, carrossel, IA de notícias.
9. `08-seed-e-polimento` — `seed_demo` e revisão final.
