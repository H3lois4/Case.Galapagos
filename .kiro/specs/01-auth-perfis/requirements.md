# Requisitos — 01-auth-perfis

## Introdução

Esta etapa entrega a autenticação e os perfis do **Por ELAS finance**. A autenticação é feita pelo **Supabase Auth** (Google e e-mail + senha, com confirmação de e-mail e recuperação de senha). O Django **não guarda senhas**: ele valida o token JWT do Supabase e mantém o **perfil local** da usuária (username, tipo de conta, empresa, dados públicos).

Também entra aqui o fluxo de verificação de empresa (código por e-mail corporativo + aprovação no admin), o perfil público (`/u/[username]`) e privado, e a funcionalidade de **seguir** usuárias e empresas.

Depende de `00-fundacao`. Prepara o terreno para todas as etapas seguintes, que passam a identificar a usuária pelo token.

## Requisitos

### Requisito 1 — Login e cadastro pelo Supabase Auth

**User Story:** Como mulher interessada, quero entrar no app com Google ou e-mail e senha, para acessar o conteúdo com segurança e sem fricção.

#### Acceptance Criteria
1. O sistema DEVE oferecer **uma única tela de login** com duas opções: **Google** e **e-mail + senha**, usando o Supabase Auth.
2. O sistema DEVE oferecer cadastro por e-mail + senha com **confirmação de e-mail** (enviada pelo Supabase).
3. O sistema DEVE oferecer **"esqueci minha senha"** por e-mail (fluxo do Supabase).
4. As telas de login, cadastro e recuperação DEVEM usar o visual do app (design system), não as telas padrão do Supabase.
5. QUANDO a sessão do Supabase existir ENTÃO o frontend DEVE persisti-la e renová-la automaticamente (refresh token).
6. O sistema DEVE oferecer **logout**, encerrando a sessão do Supabase no cliente.
7. QUANDO o cadastro for feito ENTÃO o sistema DEVE exigir **aceite de termos de uso e privacidade (LGPD)** por checkbox obrigatório antes de concluir.

### Requisito 2 — Validação do token do Supabase no Django

**User Story:** Como desenvolvedora, quero que o Django confie no token do Supabase sem armazenar senhas, para manter a autenticação centralizada e segura.

#### Acceptance Criteria
1. O sistema DEVE enviar `Authorization: Bearer <access_token>` em toda chamada autenticada à API.
2. O sistema DEVE validar o JWT no Django com uma `authentication_class` própria do DRF, verificando a assinatura pelas **chaves públicas** do projeto Supabase (JWKS em `https://<projeto>.supabase.co/auth/v1/.well-known/jwks.json`), com **cache** das chaves.
3. O sistema DEVE validar `exp`, `aud` e o emissor do token e DEVE rejeitar tokens inválidos ou expirados com `401`.
4. QUANDO o token é válido ENTÃO o sistema DEVE identificar a usuária pelo `sub` (id do Supabase).
5. O sistema NÃO DEVE armazenar senhas das usuárias no Django.
6. SE as chaves públicas não estiverem em cache ENTÃO o sistema DEVE buscá-las e cacheá-las por um tempo configurável, sem buscar a cada request.

### Requisito 3 — Criação e vínculo do perfil local

**User Story:** Como usuária nova, quero que meu perfil seja criado automaticamente no primeiro acesso, para começar a usar o app imediatamente.

#### Acceptance Criteria
1. QUANDO uma usuária autenticada faz o primeiro request válido ENTÃO o sistema DEVE criar (ou recuperar) um `User`/`Profile` local ligado ao `sub` do Supabase e ao e-mail.
2. O modelo local DEVE guardar: referência ao `sub` do Supabase, e-mail, `username`, `account_type`, FK opcional para `Company`, foto, descrição curta, link do LinkedIn e data de criação.
3. O sistema NÃO DEVE duplicar perfis para o mesmo `sub`.
4. O perfil recém-criado DEVE começar **sem `username`** definido e com `account_type` pendente de escolha.

### Requisito 4 — Escolha de username obrigatório e único

**User Story:** Como usuária, quero escolher meu nome de usuário, porque é como apareço nos posts e no meu perfil público.

#### Acceptance Criteria
1. O `username` DEVE ser **obrigatório e único** (case-insensitive), validado no backend.
2. QUANDO uma usuária entra pela primeira vez (inclusive via Google) sem `username` ENTÃO o sistema DEVE direcioná-la para a tela **"Escolha seu nome de usuário"** antes de liberar o app.
3. O sistema DEVE validar o formato do `username` (ex.: 3–30 caracteres, letras minúsculas, números, ponto e sublinhado) e informar erros claros.
4. O sistema DEVE oferecer verificação de disponibilidade do `username` antes de salvar.
5. ENQUANTO o `username` não estiver definido o sistema DEVE bloquear o acesso às telas principais.

### Requisito 5 — Tipos de conta

**User Story:** Como usuária, quero declarar se vou me capacitar ou se represento uma empresa, para ter as funções certas.

#### Acceptance Criteria
1. No cadastro/onboarding o sistema DEVE permitir escolher **"Quero me capacitar"** (`pessoal`) ou **"Represento uma empresa"** (`empresa`).
2. O `account_type` DEVE assumir `pessoal` por padrão quando não for informado.
3. QUANDO a conta é `pessoal` ENTÃO o sistema DEVE liberar as funções de usuária comum.
4. QUANDO a conta é `empresa` ENTÃO o sistema DEVE encaminhar para o fluxo de verificação de empresa (Requisito 6).

### Requisito 6 — Verificação de empresa

**User Story:** Como representante de uma empresa do mercado, quero comprovar meu vínculo, para publicar conteúdo em nome da empresa.

#### Acceptance Criteria
1. O sistema DEVE coletar: nome da empresa, CNPJ (opcional no MVP), site e **e-mail corporativo**.
2. O sistema DEVE **bloquear domínios de e-mail gratuitos** (gmail.com, hotmail.com, outlook.com, yahoo.com, icloud.com, bol.com.br, uol.com.br e similares) no campo de e-mail corporativo.
3. QUANDO o e-mail corporativo é informado ENTÃO o sistema DEVE enviar um **código de 6 dígitos** para esse e-mail, que **expira em 15 minutos** e aceita no **máximo 5 tentativas**.
4. QUANDO o código correto é confirmado dentro do prazo ENTÃO o sistema DEVE criar/vincular a `Company` com status `pendente`.
5. O sistema DEVE permitir ao **admin aprovar** a empresa (status `aprovada`) pelo Django Admin, liberando as funções de empresa.
6. ENQUANTO a empresa estiver `pendente` o sistema DEVE tratar a conta como `pessoal` e exibir o aviso **"Sua empresa está em análise"**.
7. O sistema DEVE suportar uma **lista de domínios pré-aprovados** (ex.: `galapagoscapital.com`) que, após a confirmação do código, deixam a empresa **`aprovada` automaticamente**.
8. SE o código expirar ou exceder as tentativas ENTÃO o sistema DEVE permitir **reenviar** um novo código.
9. Várias usuárias com o mesmo domínio/empresa DEVEM poder se vincular à **mesma `Company`**.

### Requisito 7 — Perfil privado

**User Story:** Como usuária, quero ver e editar meus dados, para manter meu perfil atualizado e gerenciar minha conta.

#### Acceptance Criteria
1. O sistema DEVE exibir, **apenas para a própria usuária**: e-mail, tipo de conta, status da empresa e configurações.
2. O sistema DEVE permitir editar: foto, nome de exibição, descrição curta e link do LinkedIn.
3. O sistema DEVE permitir **logout** e **excluir conta** (remover o perfil local; a exclusão no Supabase é documentada).
4. As áreas "plano de carreira", "minhas mentorias" e "histórico" DEVEM ter espaço reservado, preenchido nas etapas que as implementam.

### Requisito 8 — Perfil público

**User Story:** Como visitante, quero ver o perfil público de uma usuária ou empresa, para conhecê-la e segui-la.

#### Acceptance Criteria
1. O sistema DEVE expor um perfil público em `/u/[username]` com: foto, nome, `username`, descrição curta, link do LinkedIn e contadores de seguidores/seguindo.
2. O perfil público de **empresa** DEVE mostrar logo, descrição e site (aulas e posts entram nas etapas respectivas).
3. O perfil público NÃO DEVE expor dados privados (e-mail, configurações).
4. SE o `username` não existir ENTÃO o sistema DEVE retornar "perfil não encontrado".

### Requisito 9 — Seguir

**User Story:** Como usuária, quero seguir pessoas e empresas, para acompanhar quem me interessa.

#### Acceptance Criteria
1. O sistema DEVE permitir **seguir** e **deixar de seguir** uma usuária ou empresa.
2. O sistema DEVE expor contadores de **seguidores** e **seguindo** no perfil.
3. O sistema NÃO DEVE permitir seguir a si mesma nem seguir duas vezes (restrição única).
4. O estado de "seguindo" DEVE refletir no botão do perfil para a usuária autenticada.

### Requisito 10 — Admin

**User Story:** Como equipe do app, quero administrar contas e empresas, para aprovar empresas e moderar.

#### Acceptance Criteria
1. O Django Admin DEVE listar `Profile` e `Company` com busca e filtros úteis (status, tipo, domínio).
2. O admin DEVE poder alterar o status da empresa (`pendente` → `aprovada`/`rejeitada`).
3. O admin DEVE visualizar os vínculos usuária ↔ empresa.

### Requisito 11 — Segurança e privacidade

**User Story:** Como responsável pelo produto, quero tratar dados com cuidado, para respeitar a privacidade das usuárias (LGPD).

#### Acceptance Criteria
1. O sistema NÃO DEVE expor o `sub` do Supabase nem e-mails em respostas públicas.
2. O sistema DEVE registrar o aceite de termos (data/versão) no perfil.
3. Endpoints que alteram o próprio perfil DEVEM exigir autenticação e só permitir alterar os próprios dados.
4. O código de verificação de empresa DEVE ser armazenado de forma não trivial (hash) e invalidado após uso.
