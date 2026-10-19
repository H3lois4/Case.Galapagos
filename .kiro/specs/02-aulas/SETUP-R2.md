# Passo a passo — Cloudflare R2 (armazenamento de vídeos e imagens)

Guia para você criar o armazenamento dos vídeos/imagens antes de implementar o `02-aulas`. O R2 é compatível com S3 e tem **plano gratuito** (10 GB de armazenamento + sem custo de saída/egress). Ao final, você vai me passar **6 valores** (📌).

> O R2 pede um **cartão** (ou PayPal) para ativar, mesmo no free — não cobra dentro do limite gratuito. Se preferir não cadastrar cartão agora, me avise: dá para adiar essa etapa e eu implemento o `02-aulas` usando um placeholder/local temporário, plugando o R2 depois.

---

## Etapa 1 — Ativar o R2

1. Acesse **https://dash.cloudflare.com** e crie a conta (ou entre).
2. No menu da esquerda, clique em **R2 Object Storage**.
3. Clique em **Purchase / Enable R2** e confirme o plano **Free** (pode pedir cartão para ativar; dentro de 10 GB não há cobrança).

---

## Etapa 2 — Criar o bucket

1. Em **R2 → Create bucket**.
2. **Bucket name:** `por-elas-media` (ou o que preferir).
3. **Location:** deixe automático (ou a região mais próxima).
4. **Create bucket**.
   - 📌 **(1) R2_BUCKET** = o nome do bucket (`por-elas-media`).

---

## Etapa 3 — Pegar o Account ID e montar o endpoint

1. Ainda em R2, no painel inicial do R2 (ou em **R2 → Overview**), procure o **Account ID** (também aparece em Workers/visão geral da conta).
   - 📌 **(2) R2_ACCOUNT_ID** = esse identificador (uma sequência de letras/números).
2. O endpoint S3 do R2 é montado assim (eu monto no código, mas anote se quiser conferir):
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## Etapa 4 — Criar o token de API (credenciais S3)

1. Em **R2 → API / Manage R2 API Tokens** (botão costuma estar no canto superior direito do painel do R2, como **"Manage R2 API Tokens"**).
2. **Create API token**.
3. Configure:
   - **Token name:** `por-elas-api`
   - **Permissions:** **Object Read & Write** (leitura e escrita de objetos).
   - **Specify bucket(s):** selecione **apenas** o `por-elas-media` (bom para segurança).
   - TTL: pode deixar sem expiração para o hackathon.
4. **Create API Token**.
5. A tela mostra, **uma única vez**:
   - 📌 **(3) R2_ACCESS_KEY_ID** = o **Access Key ID**.
   - 📌 **(4) R2_SECRET_ACCESS_KEY** = o **Secret Access Key**.
   - (Ela também mostra o endpoint S3, que bate com o da Etapa 3.)

> ⚠️ Copie as duas chaves agora — a secret não aparece de novo. Se perder, é só criar outro token.

---

## Etapa 5 — Deixar o bucket público (para servir os vídeos)

Os vídeos precisam ter uma URL pública de leitura para o player tocar.

1. Abra o bucket `por-elas-media` → aba **Settings**.
2. Em **Public access**, ache **R2.dev subdomain** (ou "Public Development URL") e **habilite** (Allow Access).
3. O Cloudflare gera uma URL pública, algo como:
   `https://pub-xxxxxxxxxxxx.r2.dev`
   - 📌 **(5) R2_PUBLIC_BASE_URL** = essa URL pública (sem barra no fim).

> Para o hackathon, o subdomínio `r2.dev` é suficiente. Em produção séria dá para ligar um domínio próprio, mas não é necessário agora.

---

## Etapa 6 — Configurar o CORS do bucket (upload direto do navegador)

Como o navegador envia o vídeo **direto** para o R2, o bucket precisa permitir isso via CORS.

1. No bucket `por-elas-media` → **Settings** → **CORS policy** → **Add/Edit**.
2. Cole esta política (depois a gente ajusta o domínio da Vercel quando existir):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Salve.
   - 📌 **(6)** Não é um valor para me mandar — só **confirme** que salvou o CORS. (Mas me avise se a URL do seu frontend na Vercel já existir, para eu incluir.)

---

## O que me enviar no final

| # | Valor | Exemplo |
| --- | --- | --- |
| 1 | **R2_BUCKET** | `por-elas-media` |
| 2 | **R2_ACCOUNT_ID** | `a1b2c3d4e5f6...` |
| 3 | **R2_ACCESS_KEY_ID** | (string) |
| 4 | **R2_SECRET_ACCESS_KEY** | (string — sensível) |
| 5 | **R2_PUBLIC_BASE_URL** | `https://pub-xxxx.r2.dev` |

E confirme:
- [ ] Bucket criado e **público** (r2.dev habilitado).
- [ ] Token com **Object Read & Write** restrito ao bucket.
- [ ] **CORS** salvo com `localhost:3000` (e Vercel).

### Segurança desses dados
- `R2_ACCESS_KEY_ID` e principalmente `R2_SECRET_ACCESS_KEY` são **sensíveis**: vão para o `.env` do backend e para as variáveis da Vercel, **nunca** para o Git nem para o frontend. O navegador nunca vê a secret — ele só recebe uma URL pré-assinada temporária que o Django gera.
- A `R2_PUBLIC_BASE_URL` é pública por natureza (é o que serve os vídeos).

Assim que me enviar os 5 valores (e os checkboxes), eu implemento o `02-aulas` inteiro e a gente testa o upload e o player de verdade.

---

### Fontes (verificadas em out/2026)
- API S3 e tokens do R2 (Object Read & Write): [Cloudflare R2 — Authentication/tokens](https://developers.cloudflare.com/r2/api/s3/tokens).
- Buckets públicos (r2.dev): [Cloudflare R2 — Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).
- Compatibilidade S3 e endpoint: [Cloudflare R2 — S3 API](https://developers.cloudflare.com/r2/api/s3/api/).

> Conteúdo reescrito a partir das fontes para fins de conformidade de licenciamento.
