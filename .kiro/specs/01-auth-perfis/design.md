# Design — 01-auth-perfis

## Visão geral

Autenticação centralizada no **Supabase Auth**; o Django é um **resource server** que valida o JWT e mantém os perfis. O frontend usa `@supabase/supabase-js` para login/sessão e envia o `access_token` como Bearer para a API.

```
Usuária ──login──> Supabase Auth ──JWT──> Frontend (sessão)
Frontend ──Bearer JWT──> Django DRF ──valida via JWKS──> Profile local (sub)
```

Decisões-chave:
- **Sem senhas no Django.** O Django confia no JWT assinado pelo Supabase (JWT Signing Keys **assimétricas**, validadas por JWKS com PyJWT).
- **Perfil local (`Profile`) é a fonte de verdade** de username, tipo de conta, empresa e dados públicos.
- **Provisionamento preguiçoso (JIT):** o `Profile` é criado no primeiro request autenticado.

## Backend

### Dependências novas (`backend/requirements.txt`)
`PyJWT[crypto]` (validação JWT + chaves assimétricas), `cryptography`, `requests` (buscar JWKS). E-mail usa o backend SMTP do Django (configurado por env).

### Modelos (`accounts/models.py`)

```python
class Company(models.Model):
    STATUS = [("pendente", "Pendente"), ("aprovada", "Aprovada"), ("rejeitada", "Rejeitada")]
    nome = models.CharField(max_length=160)
    slug = models.SlugField(unique=True)
    logo = models.URLField(blank=True)          # URL no R2 (etapa de aulas/rede)
    descricao = models.TextField(blank=True)
    site = models.URLField(blank=True)
    cnpj = models.CharField(max_length=18, blank=True)
    dominio = models.CharField(max_length=120, blank=True, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS, default="pendente")
    criada_em = models.DateTimeField(auto_now_add=True)

class Profile(models.Model):
    TIPOS = [("pessoal", "Pessoal"), ("empresa", "Empresa")]
    supabase_sub = models.CharField(max_length=64, unique=True, db_index=True)
    email = models.EmailField()
    username = models.CharField(max_length=30, unique=True, null=True, blank=True)
    username_ci = models.CharField(max_length=30, unique=True, null=True, blank=True)  # lower() p/ unicidade case-insensitive
    account_type = models.CharField(max_length=10, choices=TIPOS, default="pessoal")
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name="membros")
    nome_exibicao = models.CharField(max_length=80, blank=True)
    foto = models.URLField(blank=True)
    descricao = models.CharField(max_length=200, blank=True)
    linkedin = models.URLField(blank=True)
    termos_aceitos_em = models.DateTimeField(null=True, blank=True)
    termos_versao = models.CharField(max_length=20, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

class EmailVerification(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="verificacoes")
    email_corporativo = models.EmailField()
    nome_empresa = models.CharField(max_length=160)
    site = models.URLField(blank=True)
    cnpj = models.CharField(max_length=18, blank=True)
    codigo_hash = models.CharField(max_length=128)      # hash do código de 6 dígitos
    tentativas = models.PositiveSmallIntegerField(default=0)
    expira_em = models.DateTimeField()
    consumido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

class Follow(models.Model):
    seguidor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="seguindo_set")
    seguido_profile = models.ForeignKey(Profile, null=True, blank=True, on_delete=models.CASCADE, related_name="seguidores_set")
    seguido_company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.CASCADE, related_name="seguidores_set")
    criado_em = models.DateTimeField(auto_now_add=True)
    # unique_together p/ (seguidor, seguido_profile) e (seguidor, seguido_company); impedir auto-seguir
```

`username_ci` mantém a unicidade case-insensitive de forma portável (preenchido no save com `username.lower()`).

### Autenticação DRF (`accounts/authentication.py`)

`SupabaseJWTAuthentication(BaseAuthentication)`:
1. Lê o header `Authorization: Bearer <token>`.
2. Obtém o `kid` do header do JWT, busca a chave pública no **JWKS** (cache em memória + Django cache, TTL configurável, ex. 10 min; refetch se `kid` desconhecido).
3. Valida assinatura (RS256/ES256), `exp`, `aud` (`authenticated`) e `iss` (`https://<projeto>.supabase.co/auth/v1`).
4. Extrai `sub` e `email`; faz `get_or_create` do `Profile` (JIT) — retorna um objeto de usuária que o DRF trata como autenticado.
5. Erros → `AuthenticationFailed` (401).

Um `ProfileUser` leve (wrapper) carrega o `Profile` e expõe `is_authenticated = True`, sem depender do `auth.User` do Django. Config em settings: `SUPABASE_PROJECT_URL`, `SUPABASE_JWT_AUD`, `SUPABASE_JWKS_TTL`.

### Permissões
- `IsAuthenticated` nas rotas que exigem login.
- `PerfilCompleto` (custom): exige `username` definido para liberar as telas principais (retorna 403 com código `username_requerido` para o front redirecionar).
- Endpoints de edição só mexem no `request.user.profile`.

### Endpoints (DRF, sob `/api/`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/me/` | Perfil da usuária autenticada (inclui flags `precisa_username`, `empresa_status`). |
| PATCH | `/api/me/` | Edita nome, foto, descrição, LinkedIn. |
| POST | `/api/me/username/` | Define/atualiza username (valida formato + unicidade). |
| GET | `/api/me/username-disponivel/?u=` | Checa disponibilidade. |
| POST | `/api/me/aceite-termos/` | Registra aceite (data + versão). |
| POST | `/api/me/tipo-conta/` | Define `pessoal`/`empresa`. |
| DELETE | `/api/me/` | Exclui o perfil local. |
| POST | `/api/empresa/verificar/` | Inicia verificação: valida domínio (bloqueia gratuitos), cria `EmailVerification`, envia código. |
| POST | `/api/empresa/confirmar/` | Confirma código (checa expiração/tentativas), cria/vincula `Company` (pré-aprovados → `aprovada`). |
| POST | `/api/empresa/reenviar/` | Reenvia novo código. |
| GET | `/api/u/<username>/` | Perfil público (usuária ou empresa), sem dados privados. |
| POST | `/api/u/<username>/seguir/` | Seguir. |
| DELETE | `/api/u/<username>/seguir/` | Deixar de seguir. |

Validação de domínio: lista `DOMINIOS_GRATUITOS` (bloqueio) e `DOMINIOS_PRE_APROVADOS` (auto-aprovação) em settings/const. Código de 6 dígitos gerado com `secrets`, guardado como hash (`django.contrib.auth.hashers`), enviado por e-mail (template simples com a marca).

### Admin (`accounts/admin.py`)
- `CompanyAdmin`: lista nome, domínio, status, data; filtro por status; ação "aprovar empresas selecionadas".
- `ProfileAdmin`: lista username, email, tipo, empresa; busca por username/email; filtro por tipo e status da empresa.

### Settings adicionais
`SUPABASE_PROJECT_URL`, `SUPABASE_JWT_AUD=authenticated`, `SUPABASE_JWKS_TTL`, `EMAIL_*` (SMTP), `DEFAULT_FROM_EMAIL`, `TERMOS_VERSAO`, `DOMINIOS_PRE_APROVADOS`. DRF `DEFAULT_AUTHENTICATION_CLASSES` passa a incluir `SupabaseJWTAuthentication`.

## Frontend

### Cliente Supabase (`lib/supabase.ts`)
`createBrowserClient` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Helpers de sessão e um hook/contexto `AuthProvider` que expõe `session`, `user`, `signOut` e injeta o `access_token` no `lib/api.ts`.

### Guarda de rotas
Um wrapper no `(app)/layout.tsx` (client) que:
1. Sem sessão → redireciona para `/login`.
2. Com sessão mas `GET /api/me/` indica `precisa_username` → redireciona para `/escolher-usuario`.
3. Conta `empresa` sem verificação concluída → acesso liberado como pessoal + banner "empresa em análise"; link para `/verificar-empresa`.

### Telas (route group `(auth)`, sem a navegação principal)
- `/login` — Google + e-mail/senha, link "esqueci a senha" e "criar conta".
- `/cadastro` — e-mail/senha, escolha de tipo de conta, **checkbox de termos (LGPD)**.
- `/recuperar-senha` e `/redefinir-senha` — fluxo do Supabase.
- `/escolher-usuario` — input de username com checagem de disponibilidade em tempo real.
- `/verificar-empresa` — formulário (nome, site, CNPJ opcional, e-mail corporativo) → tela de código de 6 dígitos (com reenviar/erros).
- `/auth/callback` — troca de código do OAuth do Google.

### Telas (route group `(app)`)
- `/perfil` — evolui do placeholder: dados privados, edição (foto/nome/descrição/LinkedIn), logout, excluir conta, banner de empresa, seções reservadas.
- `/u/[username]` — perfil público com botão seguir e contadores.

Visual: segue o design system (azul dominante, acentos rosa), mobile-first. Logo no topo das telas de auth.

### Variáveis de ambiente novas
`frontend/.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
`backend/.env.example`: `SUPABASE_PROJECT_URL`, `SUPABASE_JWT_AUD`, `SUPABASE_JWKS_TTL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`, `DOMINIOS_PRE_APROVADOS`, `TERMOS_VERSAO`.

## Configuração externa (documentada no README, feita pela desenvolvedora)
- Criar projeto Supabase; ativar **JWT Signing Keys assimétricas**.
- Provedor Google (Client ID/Secret do Google Cloud) + URLs de redirecionamento (Vercel e localhost).
- **SMTP próprio** no Supabase (o padrão só envia para o time) e ajuste de rate limits de e-mail.
- Guardar `SUPABASE_URL`/`ANON_KEY` no frontend e `SUPABASE_PROJECT_URL` no backend.

## Estratégia de verificação
- Testes unitários do `SupabaseJWTAuthentication` com JWKS/JWT falsos (token válido, expirado, assinatura inválida, aud errado).
- Testes dos fluxos: criação JIT de perfil, unicidade de username (case-insensitive), bloqueio de domínio gratuito, expiração/tentativas do código, auto-aprovação de domínio pré-aprovado, seguir/deixar de seguir e restrição de auto-seguir.
- Manual: login Google e e-mail/senha ponta a ponta em dev, escolher username, verificar empresa com código real, aprovar no admin, ver perfil público.
- `python manage.py check`, `migrate`, `npm run build` e `npm run lint` verdes.

## Fora de escopo (próximas etapas)
- Conteúdo das telas principais (aulas, carreira, mentoria, prática, rede).
- Upload de foto/logo para o R2 (entra na etapa de aulas; aqui aceita URL/placeholder).
