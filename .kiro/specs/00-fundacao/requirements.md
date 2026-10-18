# Requisitos — 00-fundacao

## Introdução

Esta é a etapa de fundação do webapp **Por ELAS finance**. O objetivo é montar o monorepo com os dois lados da aplicação (frontend Next.js e backend Django + DRF), aplicar a base do design system, criar o esqueleto de navegação (barra inferior no celular / menu lateral no desktop), transformar o frontend em PWA instalável, expor um endpoint de saúde que consulta o banco e deixar os **dois projetos da Vercel fazendo deploy a partir do mesmo repositório**. Nenhuma funcionalidade de produto (auth, aulas, IA etc.) entra aqui — apenas a base sobre a qual as próximas etapas serão construídas.

Esta etapa prepara o terreno para `01-auth-perfis` em diante.

## Requisitos

### Requisito 1 — Monorepo e versionamento

**User Story:** Como desenvolvedora do projeto, quero um monorepo organizado com `frontend/` e `backend/`, para que os dois lados coexistam no mesmo repositório e façam deploy independente na Vercel.

#### Acceptance Criteria
1. QUANDO o repositório é inspecionado ENTÃO o sistema DEVE conter as pastas `frontend/` e `backend/` na raiz, além de `.kiro/` e `README.md`.
2. O sistema DEVE ter um `.gitignore` na raiz que ignore `.env`, artefatos de build (`node_modules`, `.next`, `__pycache__`, `*.pyc`, `staticfiles/`), e arquivos de vídeo.
3. QUANDO qualquer segredo for necessário ENTÃO o sistema DEVE fornecer `frontend/.env.example` e `backend/.env.example` com as chaves documentadas e SEM valores reais.
4. O sistema NÃO DEVE conter nenhum `.env` com valores reais versionado.

### Requisito 2 — Backend Django + DRF

**User Story:** Como desenvolvedora, quero um projeto Django com DRF configurado para rodar serverless na Vercel e conectar ao Postgres do Supabase, para que as próximas etapas tenham uma API pronta para crescer.

#### Acceptance Criteria
1. O sistema DEVE ter um projeto Django em `backend/` com `config/` (settings, urls) e os apps vazios do domínio registrados (`accounts`, `lessons`, `careers`, `mentorship`, `practice`, `network`, `ai`, `seed`).
2. O sistema DEVE usar Django REST Framework.
3. QUANDO `DATABASE_URL` estiver definido ENTÃO o sistema DEVE conectar ao Postgres via `dj-database-url`, com `CONN_MAX_AGE = 0` e `DISABLE_SERVER_SIDE_CURSORS = True` (pooler em modo transação, porta 6543).
4. QUANDO `DATABASE_URL` não estiver definido em desenvolvimento ENTÃO o sistema PODE cair para SQLite local, para facilitar rodar sem Supabase.
5. O sistema DEVE ler todas as configs sensíveis (`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS`, `CRON_SECRET`) de variáveis de ambiente.
6. O sistema DEVE configurar CORS permitindo `http://localhost:3000` e o domínio do frontend na Vercel (configurável por env).
7. O sistema DEVE servir arquivos estáticos (inclusive do Admin) via WhiteNoise e gerar com `collectstatic` no build.
8. O sistema DEVE incluir um entrypoint WSGI compatível com o runtime Python da Vercel e um `vercel.json` em `backend/`.

### Requisito 3 — Endpoint de saúde

**User Story:** Como operadora do app, quero um endpoint de saúde que também toque o banco, para monitorar a API e manter o projeto Supabase ativo via cron.

#### Acceptance Criteria
1. O sistema DEVE expor `GET /api/health/`.
2. QUANDO o endpoint é chamado ENTÃO o sistema DEVE executar uma consulta simples ao banco (ex.: `SELECT 1`) e retornar `200` com JSON `{ "status": "ok", "db": "ok", "time": <ISO> }`.
3. SE a consulta ao banco falhar ENTÃO o sistema DEVE retornar `503` com `{ "status": "degraded", "db": "error" }`.
4. O endpoint NÃO DEVE exigir autenticação.

### Requisito 4 — Frontend Next.js + Tailwind com design tokens

**User Story:** Como usuária, quero uma interface mobile-first com a identidade visual do Por ELAS, para que a experiência seja consistente desde o início.

#### Acceptance Criteria
1. O sistema DEVE ter um projeto Next.js (App Router) + React + TypeScript + Tailwind CSS em `frontend/`.
2. O sistema DEVE definir todos os tokens de cor do design system (claro e escuro) como variáveis CSS e expô-los no Tailwind.
3. O sistema DEVE carregar as fontes Montserrat (títulos) e Inter (interface) via `next/font`.
4. O sistema DEVE suportar tema claro e escuro (seguindo a preferência do sistema no mínimo).
5. O sistema DEVE aplicar os raios, espaçamentos e estilos de componente base (botão primário/secundário/destaque, campo) conforme o design system.
6. O sistema DEVE usar ícones Lucide.
7. O layout DEVE ser mobile-first e funcionar no desktop.

### Requisito 5 — Esqueleto de navegação

**User Story:** Como usuária, quero navegar entre as seções principais do app, para que eu encontre Aulas, Carreira, Mentoria, Prática e Rede facilmente.

#### Acceptance Criteria
1. O sistema DEVE ter um route group `(app)` com rotas placeholder para `aulas`, `carreira`, `mentoria`, `pratica`, `rede` e `perfil`.
2. QUANDO em viewport de celular ENTÃO o sistema DEVE exibir uma **barra inferior fixa** com Aulas, Carreira, Mentoria, Prática e Rede, destacando o item ativo com `azul-elas`.
3. QUANDO em viewport de desktop ENTÃO o sistema DEVE exibir um **menu lateral** com os mesmos itens.
4. O sistema DEVE exibir um avatar no topo que leva ao Perfil.
5. Cada rota placeholder DEVE renderizar um título e um texto curto indicando que a seção será construída em etapa futura.

### Requisito 6 — PWA instalável

**User Story:** Como integrante da banca, quero instalar o app no celular pelo navegador, para usá-lo como um aplicativo durante a avaliação.

#### Acceptance Criteria
1. O sistema DEVE fornecer um `manifest.webmanifest` com nome, nome curto, cor de tema, cor de fundo, `display: standalone`, `start_url` e ícones (mínimo 192px e 512px, incluindo um ícone maskable).
2. O sistema DEVE registrar um service worker (Serwist ou equivalente) que permita instalação e um fallback offline básico.
3. QUANDO acessado no Android/Chrome ENTÃO o app DEVE ser instalável ("Adicionar à tela inicial" / prompt de instalação).
4. QUANDO acessado no iOS/Safari ENTÃO o app DEVE ter os metadados `apple-touch-icon` e `apple-mobile-web-app-capable` para "Adicionar à Tela de Início".
5. O ícone do PWA DEVE ser o símbolo de barras + seta, rosa sobre fundo azul, conforme o design system.

### Requisito 7 — Integração frontend ↔ backend

**User Story:** Como desenvolvedora, quero um cliente de API no frontend apontando para o backend, para validar que os dois lados se comunicam desde a fundação.

#### Acceptance Criteria
1. O sistema DEVE ter em `frontend/lib/` um cliente de API que lê a URL base de `NEXT_PUBLIC_API_URL`.
2. O cliente DEVE estar preparado para enviar `Authorization: Bearer <token>` quando um token existir (o fluxo de auth real vem em `01-auth-perfis`).
3. O sistema DEVE demonstrar a comunicação consumindo `GET /api/health/` em algum ponto de verificação (ex.: indicador de status na tela de perfil ou numa página de diagnóstico).

### Requisito 8 — Deploy na Vercel (dois projetos)

**User Story:** Como organizadora da entrega, quero os dois projetos da Vercel fazendo deploy a partir do mesmo repositório, para que cada push na `main` publique frontend e backend.

#### Acceptance Criteria
1. O sistema DEVE conter a configuração necessária para o projeto `por-elas-web` (root `frontend/`) e para o projeto `por-elas-api` (root `backend/`).
2. O `backend/vercel.json` DEVE configurar o build Python, o roteamento para o WSGI e o `collectstatic`.
3. O README DEVE documentar, passo a passo, como criar os dois projetos na Vercel apontando para o mesmo repositório, quais variáveis de ambiente definir e como rodar as migrações contra o banco de produção.
4. O deploy de produção dos dois projetos DEVE estar funcionando (a verificação final/configuração no painel da Vercel é feita pela desenvolvedora; o repositório deve conter tudo que o deploy exige).

### Requisito 9 — README e rodar local

**User Story:** Como qualquer pessoa do time, quero um README claro, para rodar o projeto localmente e entender o deploy.

#### Acceptance Criteria
1. O README DEVE explicar como rodar frontend e backend localmente (comandos, portas, variáveis).
2. O README DEVE listar e explicar todas as variáveis de ambiente de `frontend/.env.example` e `backend/.env.example`.
3. O README DEVE explicar como fazer deploy na Vercel e como rodar o seed (quando existir).
4. QUANDO alguém seguir o README do zero ENTÃO DEVE conseguir subir os dois lados localmente e ver o frontend consumindo o `/api/health/`.
