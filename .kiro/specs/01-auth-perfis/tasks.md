# Tarefas — 01-auth-perfis

- [x] 1. Modelos e admin de contas
- [x] 1.1 Criar modelos `Company`, `Profile`, `EmailVerification`, `Follow`
  - Campos conforme o design; `username_ci` para unicidade case-insensitive; restrições únicas e impedir auto-seguir.
  - Migrações.
  - _Requisitos: 3.2, 4.1, 5.1, 6.1, 6.9, 9.3, 11.2_
- [x] 1.2 Registrar no Django Admin
  - `CompanyAdmin` (filtro por status, ação "aprovar"), `ProfileAdmin` (busca/ filtros), visão dos vínculos.
  - _Requisitos: 10.1, 10.2, 10.3_

- [x] 2. Validação do JWT do Supabase no Django
- [x] 2.1 Implementar `SupabaseJWTAuthentication`
  - PyJWT + JWKS com cache (TTL), valida assinatura/`exp`/`aud`/`iss`, extrai `sub`/`email`, `ProfileUser` wrapper, 401 em erro.
  - Settings `SUPABASE_*`; adicionar à `DEFAULT_AUTHENTICATION_CLASSES`.
  - Dependências `PyJWT[crypto]`, `cryptography`, `requests`.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
- [x] 2.2 Provisionamento JIT do perfil
  - `get_or_create` do `Profile` pelo `sub` no primeiro request; sem duplicar; sem username/ tipo pendente.
  - Permissão `PerfilCompleto` (exige username; 403 `username_requerido`).
  - _Requisitos: 3.1, 3.3, 3.4, 4.5_
- [x] 2.3 Testes de autenticação
  - Token válido, expirado, assinatura inválida, `aud` errado; criação JIT; unicidade de username.
  - _Requisitos: 2.3, 3.1, 4.1_

- [x] 3. Endpoints de perfil (me) e username
- [x] 3.1 `GET/PATCH/DELETE /api/me/` + serializers
  - Retorna flags (`precisa_username`, `empresa_status`); edição dos próprios dados; exclusão do perfil local.
  - _Requisitos: 7.1, 7.2, 7.3, 11.1, 11.3_
- [x] 3.2 Username: definir e checar disponibilidade
  - `POST /api/me/username/` (formato 3–30, minúsculas/números/._, único CI), `GET /api/me/username-disponivel/`.
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_
- [x] 3.3 Aceite de termos e tipo de conta
  - `POST /api/me/aceite-termos/` (data+versão), `POST /api/me/tipo-conta/`.
  - _Requisitos: 1.7, 5.1, 5.2, 11.2_

- [x] 4. Verificação de empresa
- [x] 4.1 Iniciar verificação
  - `POST /api/empresa/verificar/`: valida domínio (bloqueia gratuitos), cria `EmailVerification`, gera código (secrets) + hash, envia e-mail.
  - _Requisitos: 6.1, 6.2, 6.3, 11.4_
- [x] 4.2 Confirmar e reenviar
  - `POST /api/empresa/confirmar/` (expiração 15 min, máx. 5 tentativas, cria/vincula `Company`, pré-aprovados → `aprovada`), `POST /api/empresa/reenviar/`.
  - _Requisitos: 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
- [x] 4.3 Testes de verificação
  - Bloqueio de gratuito, expiração/tentativas, auto-aprovação pré-aprovada, vínculo à mesma empresa.
  - _Requisitos: 6.2, 6.3, 6.4, 6.7_

- [x] 5. Perfil público e seguir
- [x] 5.1 `GET /api/u/<username>/`
  - Dados públicos (usuária/empresa), contadores; sem dados privados; 404 se não existir.
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 11.1_
- [x] 5.2 Seguir / deixar de seguir
  - `POST`/`DELETE /api/u/<username>/seguir/`; impedir auto-seguir e duplicado; contadores.
  - _Requisitos: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Frontend — Supabase e guarda de rotas
- [x] 6.1 Cliente Supabase + AuthProvider
  - `lib/supabase.ts`, contexto de sessão, injeção do token no `lib/api.ts`, logout.
  - `frontend/.env.example` com `NEXT_PUBLIC_SUPABASE_*`.
  - _Requisitos: 1.5, 1.6, 2.1_
- [x] 6.2 Guarda no `(app)/layout.tsx`
  - Sem sessão → `/login`; sem username → `/escolher-usuario`; empresa pendente → banner.
  - _Requisitos: 4.2, 4.5, 6.6_

- [x] 7. Frontend — telas de autenticação `(auth)`
- [x] 7.1 Login, cadastro e recuperação
  - `/login` (Google + e-mail/senha), `/cadastro` (tipo de conta + termos LGPD), `/recuperar-senha`, `/redefinir-senha`, `/auth/callback`. Visual do app.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.7, 5.1_
- [x] 7.2 Escolher usuário e verificar empresa
  - `/escolher-usuario` (disponibilidade em tempo real), `/verificar-empresa` (formulário + código 6 dígitos + reenviar/erros).
  - _Requisitos: 4.2, 4.3, 4.4, 6.1, 6.3, 6.8_

- [x] 8. Frontend — perfis
- [x] 8.1 Perfil privado (`/perfil`)
  - Dados privados, edição, logout, excluir conta, banner de empresa, seções reservadas.
  - _Requisitos: 7.1, 7.2, 7.3, 7.4_
- [x] 8.2 Perfil público (`/u/[username]`)
  - Público + botão seguir/contadores; estado de seguindo.
  - _Requisitos: 8.1, 8.2, 9.2, 9.4_

- [x] 9. Documentação e verificação final
- [x] 9.1 README: configuração do Supabase
  - Projeto, JWT assimétrico, Google, redirect URLs, SMTP próprio, rate limits, variáveis.
  - _Requisitos: 1.1, 2.2_
- [x] 9.2 Verificar tudo
  - `check`, `migrate`, testes, `npm run build`/`lint`; fluxo manual ponta a ponta (login, username, empresa, seguir).
  - _Requisitos: 1.1–11.4 (validação geral)_

- [x] 10. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
