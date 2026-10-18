# Tarefas — 00-fundacao

- [ ] 1. Preparar o monorepo e o versionamento
  - Criar `.gitignore` na raiz (ignorar `.env`, `node_modules`, `.next`, `__pycache__`, `*.pyc`, `staticfiles/`, `db.sqlite3`, vídeos).
  - Criar a estrutura base de pastas `frontend/` e `backend/`.
  - _Requisitos: 1.1, 1.2, 1.4_

- [ ] 2. Inicializar o backend Django + DRF
- [ ] 2.1 Criar o projeto Django e os apps de domínio
  - Criar `backend/` com `manage.py`, `config/` (settings, urls, wsgi, asgi) e os apps `accounts`, `lessons`, `careers`, `mentorship`, `practice`, `network`, `ai`, `seed`, `api` (todos registrados em `INSTALLED_APPS`).
  - Adicionar `requirements.txt` com versões fixadas.
  - _Requisitos: 2.1, 2.2_
- [ ] 2.2 Configurar settings (banco, CORS, estáticos, DRF, env)
  - Ler env; configurar `dj-database-url` (Postgres com `CONN_MAX_AGE=0` e `DISABLE_SERVER_SIDE_CURSORS=True`, fallback SQLite).
  - Configurar `corsheaders`, WhiteNoise, DRF (JSON + paginação), `CRON_SECRET`.
  - _Requisitos: 2.3, 2.4, 2.5, 2.6, 2.7_
- [ ] 2.3 Implementar o endpoint de saúde
  - App `api` com view `health` em `GET /api/health/` (consulta `SELECT 1`, 200/503, sem auth).
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_
- [ ] 2.4 Configurar deploy serverless na Vercel
  - `config/wsgi.py` expondo `app`; `backend/vercel.json` com build, collectstatic e roteamento.
  - `backend/.env.example` com as chaves documentadas.
  - _Requisitos: 1.3, 2.8, 8.1, 8.2_
- [ ] 2.5 Verificar o backend localmente
  - `python manage.py check`, `migrate` (SQLite), `runserver`; confirmar `GET /api/health/` → 200 `db: ok`.
  - _Requisitos: 3.2, 9.4_

- [ ] 3. Inicializar o frontend Next.js + Tailwind
- [ ] 3.1 Criar o projeto Next.js (App Router + TS + Tailwind)
  - `frontend/` com Next.js, TypeScript, Tailwind, ESLint; `frontend/.env.example` com `NEXT_PUBLIC_API_URL`.
  - _Requisitos: 4.1, 1.3_
- [ ] 3.2 Aplicar os design tokens e a tipografia
  - Variáveis CSS (claro/escuro) em `globals.css`; mapear no `tailwind.config.ts` (cores, raios, fontes, `darkMode: "class"`).
  - Carregar Montserrat e Inter via `next/font`; script inline de tema sem flash.
  - _Requisitos: 4.2, 4.3, 4.4, 4.5_
- [ ] 3.3 Criar componentes de UI base
  - `Button` (primary/secondary/destaque), `Card`, `PlaceholderScreen`; ícones Lucide.
  - _Requisitos: 4.5, 4.6_

- [ ] 4. Montar o esqueleto de navegação
- [ ] 4.1 Criar o shell `(app)` com navegação responsiva
  - `(app)/layout.tsx` com `TopBar` (avatar → `/perfil`), `BottomNav` (mobile, fixo) e `SideNav` (desktop); item ativo em `azul-elas` via `usePathname`.
  - _Requisitos: 5.2, 5.3, 5.4, 4.7_
- [ ] 4.2 Criar as rotas placeholder
  - Páginas `aulas`, `carreira`, `mentoria`, `pratica`, `rede`, `perfil` usando `PlaceholderScreen`; `app/page.tsx` redireciona para `/aulas`.
  - _Requisitos: 5.1, 5.5_

- [ ] 5. Transformar o frontend em PWA
- [ ] 5.1 Manifest e ícones
  - `app/manifest.ts` (standalone, theme/background, ícones 192/512 + maskable); gerar ícones placeholder (barras+seta rosa sobre azul) em `public/icons/`; meta `apple-touch-icon`/`apple-mobile-web-app-capable` e `theme-color` no layout.
  - _Requisitos: 6.1, 6.4, 6.5_
- [ ] 5.2 Service worker (Serwist)
  - Integrar `@serwist/next`, `app/sw.ts` com precache + runtime caching + fallback offline; registrar no build.
  - _Requisitos: 6.2, 6.3_

- [ ] 6. Integrar frontend e backend
  - `lib/api.ts` (base URL de env, bearer opcional) e `getHealth()`; `/perfil` mostra selo "API: ok/erro" consumindo `/api/health/`.
  - _Requisitos: 7.1, 7.2, 7.3_

- [ ] 7. Verificar o frontend
  - `npm run lint` e `npm run build` passam; `npm run dev` sobe; `/perfil` mostra o status da API; manifest + SW reconhecidos.
  - _Requisitos: 4.1, 6.3, 9.4_

- [ ] 8. Documentar (README) e configuração de deploy
  - README: rodar local (frontend + backend), tabela de variáveis de ambiente, passo a passo dos dois projetos Vercel apontando para o mesmo repo, como rodar `migrate` em produção e como (futuramente) rodar o seed.
  - _Requisitos: 8.3, 8.4, 9.1, 9.2, 9.3_

- [ ] 9. Commit e push na main
  - Rodar lint/build antes; commit em Conventional Commits PT (ex.: `chore(fundacao): monorepo, django+drf, next+pwa e health`); `git push` logo após.
  - _Requisitos: 1.4_
