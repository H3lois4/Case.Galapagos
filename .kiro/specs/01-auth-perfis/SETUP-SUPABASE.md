# Passo a passo — criar o projeto no Supabase (Por ELAS finance)

Guia para você montar o Supabase antes de implementar o spec `01-auth-perfis`. Ao final, você vai ter **7 valores** para me passar (marcados com 📌). Tudo em plano gratuito.

> A interface do Supabase muda com frequência. Se um menu tiver nome ligeiramente diferente, procure pelo termo em inglês entre parênteses — os nomes internos mudam menos.

---

## Etapa 1 — Criar a conta e o projeto

1. Acesse https://supabase.com e entre com o GitHub (ou e-mail).
2. **New project**.
   - **Name:** `por-elas` (ou o que preferir).
   - **Database Password:** gere uma senha forte e **guarde** — ela entra na string de conexão do banco. (Dá para resetar depois em Settings › Database.)
   - **Region:** escolha a mais próxima do Brasil — **South America (São Paulo)** se disponível; senão **East US**.
   - **Plan:** Free.
3. Aguarde ~2 minutos até o projeto subir.

---

## Etapa 2 — Pegar URL e chave pública (anon key)

1. No projeto, vá em **Settings (ícone de engrenagem) › API** (ou **Project Settings › API Keys**).
2. Anote:
   - 📌 **(1) Project URL** — algo como `https://abcdefgh.supabase.co`.
   - 📌 **(2) anon public key** — chave longa que começa com `eyJ...` (a chave **anon/publishable**, NÃO a `service_role`).

> ⚠️ Nunca me mande a chave **service_role** nem a senha do banco. Só a `anon`/publishable, que é feita para o navegador.

---

## Etapa 3 — Ativar JWT assimétrico (importante)

O Django vai validar o login pelas **chaves públicas** do Supabase. Para isso, o Supabase precisa assinar os tokens com chave **assimétrica** (RS256/ES256), não com o segredo simétrico antigo.

1. Vá em **Authentication › Signing Keys** (ou **Settings › JWT Keys / JWT Signing Keys**).
2. Se houver a opção, **crie/rotacione para uma chave assimétrica** (tipo **ECC / P-256** ou **RSA**) e deixe-a como **current (em uso)**.
   - Em projetos novos isso muitas vezes já vem ativo. Se você vir uma chave do tipo `ECC (P-256)` ou `RSA` marcada como "Current key", está pronto.
3. Confirme que o endereço público das chaves responde (abra no navegador):
   - `https://SEU-PROJETO.supabase.co/auth/v1/.well-known/jwks.json`
   - Deve aparecer um JSON com uma lista `keys`. É daqui que o Django vai ler as chaves.

> Não precisa me mandar nada desta etapa — o Django descobre as chaves sozinho pela URL acima. Só garanta que a chave em uso é assimétrica.

---

## Etapa 4 — Login por e-mail + senha

1. Vá em **Authentication › Sign In / Providers** (ou **Providers**).
2. **Email** deve estar **habilitado**.
3. Deixe **"Confirm email"** ligado (a usuária confirma o e-mail antes de entrar).
4. Salve.

---

## Etapa 5 — Login com Google

Precisa de um app OAuth no Google Cloud. Vai com calma, é a parte mais chatinha.

### 5a. No Google Cloud
1. Acesse https://console.cloud.google.com e crie (ou escolha) um projeto.
2. **APIs & Services › OAuth consent screen**:
   - User type: **External**.
   - Preencha nome do app ("Por ELAS finance"), e-mail de suporte e e-mail do desenvolvedor.
   - Em "Test users", adicione os e-mails que vão testar enquanto o app estiver em modo de teste (ou publique depois).
3. **APIs & Services › Credentials › Create Credentials › OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs** → adicione exatamente:
     - `https://SEU-PROJETO.supabase.co/auth/v1/callback`
     (troque `SEU-PROJETO` pelo ref do seu projeto; é a URL da etapa 2 com `/auth/v1/callback` no fim)
   - Create.
4. Copie o **Client ID** e o **Client Secret** que aparecem.

### 5b. No Supabase
1. **Authentication › Providers › Google**.
2. Ative, cole o **Client ID** e o **Client Secret** do passo anterior.
3. Salve.

> O Client ID/Secret do Google ficam **só no painel do Supabase** — eu não preciso deles no código. O Supabase cuida do fluxo do Google.

---

## Etapa 6 — URLs de redirecionamento do app

Para o login (principalmente o Google) voltar para o app certo:

1. **Authentication › URL Configuration**.
2. **Site URL:** por enquanto `http://localhost:3000` (depois troca para a URL da Vercel do frontend).
3. **Redirect URLs (Additional):** adicione:
   - `http://localhost:3000/**`
   - `https://*.vercel.app/**` (ou a URL exata do `por-elas-web` quando existir)
4. Salve.

---

## Etapa 7 — SMTP próprio (obrigatório)

O envio de e-mail padrão do Supabase só manda para membros do seu time e tem limite de **2 e-mails por hora** — isso quebraria o cadastro da plateia. Então configure um SMTP próprio.

**Opção A — Gmail (mais simples para o hackathon):**
1. Crie/escolha um Gmail da plataforma (ex.: `porelasfinance@gmail.com`).
2. Ative a **verificação em duas etapas** na conta Google.
3. Gere uma **Senha de app** (Google Account › Security › App passwords) — 16 caracteres.
4. No Supabase: **Authentication › Emails › SMTP Settings** (ou **Settings › Auth › SMTP**), ligue **Enable Custom SMTP** e preencha:
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** o e-mail Gmail
   - **Password:** a senha de app (os 16 caracteres)
   - **Sender email / Sender name:** o e-mail e "Por ELAS finance"
5. Salve.

**Opção B — Resend/Brevo (grátis, melhor entregabilidade):** crie conta, verifique um domínio/remetente e use o host/porta/usuário/senha SMTP que eles fornecem, nos mesmos campos acima.

### Ajustar o limite de e-mails
- **Authentication › Rate Limits** → aumente o limite de e-mails (ex.: 30/hora ou mais), já que agora você usa SMTP próprio.

> **Reaproveitamento:** esse **mesmo SMTP** vai servir também para os e-mails que o nosso Django manda (código de verificação de empresa, confirmação de mentoria). Por isso guarde os 4 dados do SMTP — eles entram nos 📌 abaixo.

---

## Etapa 8 — String de conexão do banco (para o Django)

1. No topo do projeto, clique em **Connect** (ou **Settings › Database › Connection string**).
2. Escolha **Transaction pooler** (o host contém `pooler.supabase.com` e a **porta é `6543`**). É o modo certo para o backend serverless.
3. Copie a string, algo como:
   ```
   postgresql://postgres.SEU-REF:[SUA-SENHA]@aws-0-REGIAO.pooler.supabase.com:6543/postgres
   ```
4. Substitua `[SUA-SENHA]` pela senha do banco que você definiu na Etapa 1.
   - 📌 **(3) DATABASE_URL** = essa string completa já com a senha.

> Use a do **pooler / porta 6543** (transação), não a direta (5432). É o que o nosso settings espera.

---

## O que me enviar no final

Me passe estes valores (os 📌). Pode colar aqui no chat:

| # | Valor | Onde usei | Exemplo |
| --- | --- | --- | --- |
| 1 | **Project URL** | front + back | `https://abcd.supabase.co` |
| 2 | **anon public key** | frontend | `eyJhbGciOi...` |
| 3 | **DATABASE_URL** (pooler 6543, com senha) | backend | `postgresql://postgres.abcd:...@...pooler.supabase.com:6543/postgres` |
| 4 | **SMTP host** | backend (e-mails do app) | `smtp.gmail.com` |
| 5 | **SMTP port** | backend | `587` |
| 6 | **SMTP usuário** | backend | `porelasfinance@gmail.com` |
| 7 | **SMTP senha (senha de app)** | backend | (16 caracteres) |

E confirme que:
- [ ] A chave de assinatura em uso é **assimétrica** (Etapa 3) e o `.../jwks.json` abre.
- [ ] **Email** e **Google** estão habilitados em Authentication › Providers.
- [ ] O **redirect** `https://SEU-PROJETO.supabase.co/auth/v1/callback` está no Google Cloud.
- [ ] O **SMTP próprio** está ligado e o rate limit de e-mail foi aumentado.

### Sobre segurança desses dados
- A `anon key` é pública por natureza (feita para o navegador) — tudo bem ela ficar no frontend.
- A `DATABASE_URL` e a **senha do SMTP** são sensíveis: elas vão para **variáveis de ambiente** (`.env` local e nas Settings da Vercel), **nunca** para o Git. Nosso `.gitignore` já bloqueia `.env`.
- **Não** me mande a `service_role key` nem a senha do banco separada — só preciso da `DATABASE_URL` montada.

Assim que você me enviar esses 7 valores (e os checkboxes), eu implemento o spec `01-auth-perfis` e a gente testa o login real de ponta a ponta.

---

### Fontes (verificadas em out/2026)
- SMTP próprio e limite de 2 e-mails/hora no sender padrão: [Supabase — Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- Pooler em modo transação na porta 6543 para serverless: [Supabase — Supavisor e terminologia de conexão](https://supabase.com/docs/guides/troubleshooting/supavisor-and-connection-terminology-explained-9pr_ZO).
- Redirect do Google OAuth (`/auth/v1/callback`): [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
- JWT Signing Keys assimétricas: [Supabase — JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys).

> Conteúdo reescrito a partir das fontes para fins de conformidade de licenciamento.
