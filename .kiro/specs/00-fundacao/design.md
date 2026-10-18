# Design — 00-fundacao

## Visão geral

A fundação entrega um monorepo com dois projetos independentes de deploy na Vercel, compartilhando o repositório `Case.Galapagos`:

- `frontend/` — Next.js (App Router) + TypeScript + Tailwind, PWA, design system, navegação.
- `backend/` — Django + DRF serverless, Postgres (Supabase pooler) ou SQLite em dev, WhiteNoise, `/api/health/`.

Nenhum domínio de negócio é implementado nesta etapa; os apps Django são criados vazios para servir de âncora às próximas etapas, e as rotas do frontend são placeholders.

```
Case.Galapagos/
├── .gitignore
├── README.md
├── frontend/           # projeto Vercel: por-elas-web
└── backend/            # projeto Vercel: por-elas-api
```

## Backend

### Estrutura

```
backend/
├── manage.py
├── requirements.txt
├── vercel.json
├── .env.example
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── api/                # app técnico: health, roteamento comum
│   ├── __init__.py
│   ├── apps.py
│   ├── urls.py
│   └── views.py
├── accounts/           # apps de domínio (vazios nesta etapa)
├── lessons/
├── careers/
├── mentorship/
├── practice/
├── network/
├── ai/
└── seed/
```

Cada app de domínio é criado com `apps.py`, `__init__.py`, `models.py`, `migrations/__init__.py` vazios e registrado em `INSTALLED_APPS`, para que as migrações das etapas seguintes encaixem sem reorganização.

### Settings (pontos-chave)

- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` de env (`django-environ` ou `os.environ`).
- Banco: `dj-database-url` lê `DATABASE_URL`. Se ausente, usa SQLite (`db.sqlite3`).
  - Quando usando Postgres: `CONN_MAX_AGE = 0`, `DISABLE_SERVER_SIDE_CURSORS = True`.
- `INSTALLED_APPS`: Django padrão + `rest_framework` + `corsheaders` + apps do domínio + `api`.
- Middleware: `whitenoise.middleware.WhiteNoiseMiddleware` logo após o SecurityMiddleware; `corsheaders.middleware.CorsMiddleware` no topo.
- `STATIC_ROOT = staticfiles/`, `STATICFILES_STORAGE = whitenoise ...CompressedManifestStaticFilesStorage`.
- CORS: `CORS_ALLOWED_ORIGINS` de env (default inclui `http://localhost:3000`).
- DRF: `DEFAULT_RENDERER_CLASSES` com JSON, `DEFAULT_PAGINATION_CLASS` (PageNumberPagination, page_size 20). Autenticação fica para `01-auth-perfis`.
- `CRON_SECRET` lido de env (usado em etapas futuras; aqui só documentado).

### Endpoint de saúde

`api/views.py`:

```python
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    db_ok = True
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
    except Exception:
        db_ok = False
    status = 200 if db_ok else 503
    return Response(
        {
            "status": "ok" if db_ok else "degraded",
            "db": "ok" if db_ok else "error",
            "time": timezone.now().isoformat(),
        },
        status=status,
    )
```

Rota: `config/urls.py` inclui `path("api/", include("api.urls"))`, e `api/urls.py` mapeia `path("health/", health)`. Admin em `admin/`.

### Serverless na Vercel

- `backend/vercel.json`:

```json
{
  "buildCommand": "pip install -r requirements.txt && python manage.py collectstatic --noinput",
  "builds": [{ "src": "config/wsgi.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "config/wsgi.py" }]
}
```

- `config/wsgi.py` expõe `app = application` (a Vercel procura `app` ou `application`).
- Migrações fora do request: documentadas no README (`python manage.py migrate` apontando para o `DATABASE_URL` de produção, rodado manualmente/CI).

### Dependências (`requirements.txt`)

`Django`, `djangorestframework`, `django-cors-headers`, `dj-database-url`, `psycopg2-binary`, `whitenoise`, `gunicorn` (opcional local). Versões fixadas.

## Frontend

### Estrutura

```
frontend/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── app/
│   ├── layout.tsx            # fontes, tema, registro do SW
│   ├── globals.css           # tokens CSS + camadas Tailwind
│   ├── page.tsx              # redireciona para /aulas (ou landing simples)
│   ├── (app)/
│   │   ├── layout.tsx        # shell com bottom nav / sidebar + topbar (avatar)
│   │   ├── aulas/page.tsx
│   │   ├── carreira/page.tsx
│   │   ├── mentoria/page.tsx
│   │   ├── pratica/page.tsx
│   │   ├── rede/page.tsx
│   │   └── perfil/page.tsx   # mostra status do /api/health/
│   └── manifest.ts           # manifest dinâmico do Next
├── components/
│   ├── nav/BottomNav.tsx
│   ├── nav/SideNav.tsx
│   ├── nav/TopBar.tsx
│   └── ui/Button.tsx, Card.tsx, PlaceholderScreen.tsx
├── lib/
│   ├── api.ts                # cliente fetch com base URL + bearer opcional
│   └── theme.ts              # helper de tema claro/escuro
└── public/
    ├── brand/                # logo (placeholder até receber o arquivo oficial)
    └── icons/                # ícones PWA 192/512 + maskable + apple-touch
```

### Design tokens

`globals.css` define as variáveis nos dois temas:

```css
:root {
  --azul-elas: #1F4E9E;
  --azul-elas-escuro: #163B78;
  --azul-elas-suave: #E6EDF8;
  --rosa-elas: #EB839E;
  --rosa-elas-texto: #B3365E;
  --rosa-elas-suave: #FCE8EE;
  --cinza-logo: #DDDDDD;
  --fundo: #FFFFFF;
  --fundo-alt: #F6F5F8;
  --tinta: #1A1D2B;
  --tinta-suave: #5B6070;
  --borda: #E3E2E7;
  --sucesso: #1A7A4C;
  --perigo: #C8323C;
  --alerta: #9A6412;
}
:root.dark, .dark {
  --azul-elas: #6F98E0;
  --azul-elas-escuro: #9DBBEE;
  --azul-elas-suave: #1B2742;
  --rosa-elas: #EB839E;
  --rosa-elas-texto: #F29BB2;
  --rosa-elas-suave: #3A1F2A;
  --cinza-logo: #2A2D38;
  --fundo: #12141C;
  --fundo-alt: #1C1F2A;
  --tinta: #F2F2F5;
  --tinta-suave: #A3A7B5;
  --borda: #2E3240;
  --sucesso: #4FC08D;
  --perigo: #F2737B;
  --alerta: #E3A64A;
}
```

`tailwind.config.ts` mapeia `colors` para `var(--token)`, define `borderRadius` (chip 8, botao 12, card 20, pill 999), `fontFamily` (`montserrat`, `inter`) e `darkMode: "class"`. Tema escolhido por classe `.dark` no `<html>`, inicializada pela preferência do sistema via script inline no `layout.tsx` (evita flash).

### Tipografia

`next/font/google` carrega Montserrat (600/700/800) e Inter (400/600/700), expostas como CSS variables e referenciadas no Tailwind.

### Componentes base

- `Button` com variantes `primary` (azul, texto branco, h-48), `secondary` (borda 1,5px azul), `destaque` (rosa, texto `tinta`). Foco visível.
- `Card` (raio 20, borda, sombra só no claro).
- `PlaceholderScreen` (título + descrição curta) reutilizado nas rotas placeholder.

### Navegação

- `(app)/layout.tsx` renderiza `TopBar` (logo + avatar que leva a `/perfil`), e condicionalmente:
  - `BottomNav` fixo (`fixed bottom-0`, escondido em `md:` para cima).
  - `SideNav` (`hidden md:flex`) à esquerda.
- Itens: Aulas, Carreira, Mentoria, Prática, Rede (ícones Lucide). Item ativo em `azul-elas`, detectado por `usePathname`.

### PWA

- `app/manifest.ts` retorna o manifest (name "Por ELAS finance", short_name "Por ELAS", `display: standalone`, `theme_color` azul, `background_color` fundo, ícones 192/512 + maskable).
- Service worker com **Serwist** (`@serwist/next`): `next.config.ts` envolve a config, `app/sw.ts` define precache e runtime caching + fallback offline.
- `layout.tsx` inclui meta `apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`.
- Ícones em `public/icons/` (gerados como placeholder com o símbolo barras+seta rosa sobre azul; substituíveis pelo arquivo oficial).

### Cliente de API

`lib/api.ts`:

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, opts: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  return res;
}

export async function getHealth() {
  const res = await apiFetch("/api/health/");
  return res.json();
}
```

A tela `/perfil` chama `getHealth()` e mostra um selo "API: ok/erro" como prova de integração.

## Variáveis de ambiente

`backend/.env.example`:
```
DJANGO_SECRET_KEY=
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=
CORS_ALLOWED_ORIGINS=http://localhost:3000
CRON_SECRET=
```

`frontend/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

(As chaves de Supabase, R2, LLM, Google etc. entram nas etapas que as usarem.)

## Deploy na Vercel

Dois projetos no mesmo repo:

| Projeto | Root Directory | Framework | Env principais |
| --- | --- | --- | --- |
| `por-elas-web` | `frontend/` | Next.js | `NEXT_PUBLIC_API_URL` = URL do `por-elas-api` |
| `por-elas-api` | `backend/` | Other (Python) | `DJANGO_*`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `CRON_SECRET` |

O README detalha o passo a passo, incluindo rodar `migrate` manualmente contra o `DATABASE_URL` de produção.

## Estratégia de verificação

- Backend: `python manage.py check`, `migrate` (SQLite local) e `runserver`; `curl /api/health/` retorna `200` com `db: ok`.
- Frontend: `npm run build` e `npm run lint` passam; `npm run dev` sobe; `/perfil` mostra o selo de saúde da API; Lighthouse/DevTools reconhecem o PWA (manifest + SW).
- Git: commit + push na `main` ao final.

## Fora de escopo (próximas etapas)

- Supabase Auth, JWT, perfis, username, verificação de empresa → `01-auth-perfis`.
- R2, IA, Google Agenda, conteúdo real das telas → etapas seguintes.
