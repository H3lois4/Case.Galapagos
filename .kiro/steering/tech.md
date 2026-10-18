# Stack e infraestrutura

## Princípio

O backend continua em **Django**, mas toda a hospedagem fica na **Vercel** e o login usa o **Supabase Auth** pronto. **Não usar Render** nem outro servidor separado. Tudo em planos gratuitos.

## Frontend

- **Next.js (App Router) + React + TypeScript + Tailwind CSS.**
- Ícones: **Lucide**.
- PWA com manifest + service worker (**Serwist** ou equivalente).
- Deploy na **Vercel**, projeto `por-elas-web` (root directory `frontend/`).
- Cliente Supabase via `@supabase/supabase-js` para login, cadastro, logout e sessão.
- Toda chamada à API Django envia `Authorization: Bearer <access_token do Supabase>`.
- Layout **mobile-first** (a banca usa no celular), funcionando também no desktop.

## Backend

- **Django + Django REST Framework.**
- Deploy **também na Vercel** como projeto separado `por-elas-api` (root directory `backend/`), usando o suporte nativo da Vercel a Django (Python runtime / Vercel Functions, detecção pelo `manage.py`).
- Os dois projetos Vercel apontam para o mesmo repositório e fazem deploy automático a cada push na `main`.
- O Django roda **serverless**: nada de processos em segundo plano, threads longas ou arquivos gravados em disco. Tudo que precisa persistir vai para o banco ou para o R2.
- Arquivos estáticos (inclusive do Django Admin) gerados com `collectstatic` no build e servidos pela CDN da Vercel (ou whitenoise).
- Migrações rodam por comando manual/CI (`python manage.py migrate` apontando para produção), documentado no README — **não no request**.
- Respostas de IA em streaming (SSE) a partir das funções Python da Vercel.

## Autenticação (Supabase Auth)

- Provedores **Google** e **e-mail + senha** já prontos (inclui confirmação de e-mail e recuperação de senha).
- O Django valida o token com uma `authentication_class` própria do DRF que verifica o JWT pelas chaves públicas do projeto (`https://<projeto>.supabase.co/auth/v1/.well-known/jwks.json`, com cache), usando **PyJWT**. Ativar as **JWT Signing Keys assimétricas** no painel do Supabase.
- No primeiro request de uma usuária nova, o Django cria o `User`/`Profile` local ligado ao `sub` (id do Supabase). `username`, tipo de conta, empresa e demais dados ficam no Django.
- Configurar no painel do Supabase: provedor Google (Client ID/Secret do Google Cloud), URLs de redirecionamento da Vercel e **SMTP próprio** (o SMTP padrão do Supabase só envia para membros do time e com limite muito baixo — sem SMTP próprio o cadastro da plateia não funciona). Usar Gmail da plataforma (senha de app) ou provedor gratuito (Brevo/Resend), e ajustar o rate limit em Authentication › Rate Limits.

## Banco de dados

- **PostgreSQL do mesmo projeto Supabase** (plano free), acessado pelo Django via `DATABASE_URL`.
- Por ser serverless, conectar pelo **pooler do Supabase em modo transação (porta 6543)** com `CONN_MAX_AGE = 0` e `DISABLE_SERVER_SIDE_CURSORS = True`.

## Arquivos (vídeos, imagens, thumbnails)

- **Cloudflare R2** (compatível com S3) via `boto3`.
- **Todo upload** (vídeos e imagens de posts) vai **direto do navegador para o R2 com URL pré-assinada** gerada pelo Django — as funções da Vercel têm limite de tamanho de requisição, então o arquivo nunca passa pelo backend.

## E-mail transacional do app

- Código de verificação de empresa, confirmação de mentoria: o mesmo SMTP configurado no Supabase, usado pelo Django via variáveis de ambiente.

## Tarefas agendadas

- **Vercel Cron** (configurado em `vercel.json` do projeto `por-elas-api`) chamando endpoints protegidos por `CRON_SECRET`, ex.: notícias diárias da IA.
- Uma Vercel Cron diária pode chamar `GET /api/health/` para manter o projeto Supabase ativo (projetos free pausam após uma semana sem uso).

## IA

- Camada `ai/` no backend com um **provedor de LLM trocável por variável de ambiente** (`LLM_PROVIDER=gemini|anthropic|openai`, `LLM_MODEL`).
- Padrão inicial: **Gemini Flash** (plano gratuito). Interface única `chat(messages, system, stream=True)`.
- Rate limit nos endpoints de IA (por usuária: ex. 30 mensagens/hora) para não estourar a cota gratuita.

## Voz

- **Web Speech API** do navegador (reconhecimento de fala + síntese de voz), sem custo. Aviso quando o navegador não suportar; modo texto sempre disponível.

## Google Agenda

- Google Calendar API usando a conta Google da plataforma (OAuth com refresh token guardado em variável de ambiente).

## Regras técnicas

- Todas as chaves e segredos em variáveis de ambiente. Criar `.env.example` em `frontend/` e `backend/`. **Nunca** commitar `.env`.
- CORS configurado para o domínio do frontend na Vercel (e `localhost:3000` em dev). Como a API usa token Bearer, não depender de sessão/cookie do Django fora do Admin.
- Endpoint `GET /api/health/` leve, que também faz uma consulta simples ao banco.
- Paginação nas listas (posts, aulas, notícias).
- README com: como rodar local, variáveis de ambiente, como fazer deploy, como rodar o seed.
