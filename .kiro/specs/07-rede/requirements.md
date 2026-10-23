# Requisitos — 07-rede

## Introdução

Esta etapa entrega a tela **Rede**: um carrossel de **notícias** no topo, um **feed** de posts (comum, vaga e notícia), interações sociais (**curtir, comentar, compartilhar, seguir**) e uma **IA de notícias** que publica resumos diários (job via Vercel Cron). Reaproveita o grafo de "seguir" (`Follow`) de `01-auth-perfis`, o upload direto para o R2 (`02-aulas`) e a camada de IA (`03-ia-base`).

Depende de `00-fundacao`, `01-auth-perfis`, `02-aulas` (R2) e `03-ia-base`.

## Requisitos

### Requisito 1 — Feed de posts

**User Story:** Como usuária, quero ver um feed de posts, para acompanhar conteúdos e oportunidades.

#### Acceptance Criteria
1. O sistema DEVE exibir um **feed paginado** com os posts mais recentes, visível para qualquer usuária autenticada.
2. Cada post DEVE mostrar autor (usuária ou empresa, com selo), texto, imagem (se houver), data e contadores de curtidas/comentários.
3. O feed DEVE ter filtros: **"Todos"**, **"Quem eu sigo"** e **"Vagas"**.
4. Posts do tipo **notícia** da **IA Por ELAS** DEVEM ter selo visual próprio.

### Requisito 2 — Criar post

**User Story:** Como usuária, quero publicar um post, para compartilhar algo com a rede.

#### Acceptance Criteria
1. Qualquer usuária autenticada DEVE poder criar um post do tipo **`post`** com texto (até 2.000 caracteres) e **imagem opcional**.
2. A imagem DEVE ser enviada **direto para o R2** por URL pré-assinada (reuso da etapa 02), com validação de tipo e tamanho (≤5 MB).
3. Empresa **aprovada** DEVE poder criar também **`vaga`** (cargo, local/modelo, link de candidatura) e **`noticia`**.
4. QUANDO uma usuária pessoal tenta criar `vaga`/`noticia` ENTÃO o sistema DEVE recusar (403).
5. A autora DEVE poder **excluir** o próprio post.

### Requisito 3 — Curtir e comentar

**User Story:** Como usuária, quero curtir e comentar posts, para interagir.

#### Acceptance Criteria
1. A usuária DEVE poder **curtir/descurtir** um post (toggle), com contador atualizado.
2. A usuária DEVE poder **comentar** um post (texto) e ver os comentários.
3. A autora de um comentário DEVE poder **excluir** o próprio comentário; a autora do post também pode remover comentários do seu post.
4. Os contadores de curtidas e comentários DEVEM refletir o estado real.

### Requisito 4 — Seguir e feed personalizado

**User Story:** Como usuária, quero ver posts de quem eu sigo, para um feed mais relevante.

#### Acceptance Criteria
1. O filtro **"Quem eu sigo"** DEVE mostrar apenas posts de perfis/empresas que a usuária segue.
2. O seguir/deixar de seguir DEVE reusar o mecanismo de `Follow` já existente (usuárias e empresas).

### Requisito 5 — Compartilhar e página pública do post

**User Story:** Como usuária, quero compartilhar um post para fora do app, para divulgar conteúdo.

#### Acceptance Criteria
1. Cada post DEVE ter uma **página pública** `/post/[id]` com Open Graph (título, descrição, imagem) para pré-visualização em redes.
2. O botão **compartilhar** DEVE usar a Web Share API quando disponível, com **fallback "copiar link"**.
3. A página pública DEVE ser acessível e carregar o post mesmo sem login (leitura), respeitando a privacidade do conteúdo (posts são públicos neste MVP).

### Requisito 6 — Carrossel de notícias

**User Story:** Como usuária, quero ver as notícias em destaque, para me manter atualizada.

#### Acceptance Criteria
1. O topo da Rede DEVE ter um **carrossel horizontal** com as notícias (imagem + manchete).
2. O carrossel DEVE **trocar automaticamente a cada ~6 s**, **pausar ao tocar/hover**, ter indicadores e suportar swipe.
3. Tocar numa notícia DEVE abrir a notícia completa (página do post).
4. O carrossel DEVE respeitar `prefers-reduced-motion` (sem auto-troca quando a usuária prefere menos movimento).

### Requisito 7 — IA de notícias (job diário)

**User Story:** Como equipe do app, quero publicar resumos de notícias automaticamente, para manter a Rede ativa.

#### Acceptance Criteria
1. DEVE existir um endpoint **`POST /api/ai/news/run/`** protegido por **`CRON_SECRET`** (chamado pela Vercel Cron) que gera notícias.
2. O job DEVE ler **feeds RSS** do mercado (lista configurável), escolher alguns assuntos e escrever, **com palavras próprias**, um resumo curto (até ~120 palavras) por assunto, com **título, categoria e link para a fonte original**.
3. O sistema **NÃO DEVE copiar trechos** das fontes; o conteúdo é reescrito pela IA.
4. As notícias DEVEM ser publicadas como posts `noticia` com autor **"IA Por ELAS"** (conta oficial).
5. DEVE haver uma forma de **rodar manualmente** (botão no admin ou comando de management) para a demonstração.
6. O job DEVE processar **poucos itens por execução** (tempo das funções serverless) e **não duplicar** notícias já publicadas (dedupe por link/título).
7. SE a IA ou os feeds falharem ENTÃO o job DEVE degradar com elegância (não quebrar; logar) e nunca expor segredredes.

### Requisito 8 — Segurança e limites

#### Acceptance Criteria
1. Só usuária **autenticada** cria posts, curte, comenta e segue; leitura do feed exige autenticação, mas a página pública do post permite leitura sem login.
2. Apenas a **autora** exclui o próprio post/comentário (e a autora do post modera comentários no seu post); caso contrário 403.
3. `vaga`/`noticia` só por **empresa aprovada**; a notícia da IA só pelo job protegido por `CRON_SECRET`.
4. Imagens via R2 respeitam tipo/tamanho; segredos só em variáveis de ambiente.
