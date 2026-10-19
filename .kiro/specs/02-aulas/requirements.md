# Requisitos — 02-aulas

## Introdução

Esta etapa entrega a tela **Aulas** do Por ELAS finance: vídeos educativos sobre o mercado financeiro, organizados por empresa e numa seção "Básico com IA" (conteúdo da conta oficial "Por ELAS"). As empresas aprovadas podem publicar, editar e excluir os próprios vídeos. O **upload do vídeo vai direto do navegador para o Cloudflare R2** usando uma URL pré-assinada gerada pelo Django (o arquivo nunca passa pelo backend, por causa do limite de tamanho das funções serverless). A tela tem filtro por empresa (chips com logo), busca por título e um player.

Depende de `00-fundacao` e `01-auth-perfis`. Reaproveita `Company`, `Profile` e a autenticação por JWT.

## Requisitos

### Requisito 1 — Listagem e organização das aulas

**User Story:** Como usuária, quero ver as aulas organizadas por empresa e por fundamentos, para encontrar o conteúdo que me interessa.

#### Acceptance Criteria
1. O sistema DEVE exibir, no topo, **chips horizontais** com todas as empresas que têm aulas (com logo) + um chip **"IA Por ELAS"** + um chip "Todas".
2. O sistema DEVE exibir uma seção **"Básico com IA"** com os vídeos da conta oficial "Por ELAS".
3. O sistema DEVE exibir **uma seção por empresa** (card/carrossel) com os vídeos daquela empresa.
4. QUANDO um chip de empresa é selecionado ENTÃO o sistema DEVE filtrar a tela para mostrar apenas as aulas daquela empresa.
5. As listas DEVEM ser paginadas.
6. A tela de aulas DEVE ser visível para qualquer usuária autenticada (pessoal ou empresa).

### Requisito 2 — Busca

**User Story:** Como usuária, quero buscar aulas por título, para achar um tema específico rápido.

#### Acceptance Criteria
1. O sistema DEVE oferecer um campo de **busca por título**.
2. QUANDO a usuária digita um termo ENTÃO o sistema DEVE retornar as aulas cujo título contém o termo (case-insensitive).
3. SE não houver resultado ENTÃO o sistema DEVE exibir um estado vazio claro.

### Requisito 3 — Publicar aula (empresa aprovada)

**User Story:** Como empresa aprovada, quero publicar um vídeo, para divulgar conteúdo em nome da empresa.

#### Acceptance Criteria
1. QUANDO a usuária é de uma empresa **aprovada** ENTÃO o sistema DEVE exibir o botão **"Adicionar conteúdo"**.
2. QUANDO a usuária NÃO é de empresa aprovada ENTÃO o botão NÃO DEVE aparecer e os endpoints de criação DEVEM retornar 403.
3. O formulário DEVE coletar: **título** (obrigatório), **descrição**, **thumbnail** (opcional) e o **arquivo de vídeo** (obrigatório).
4. QUANDO a aula é publicada ENTÃO ela DEVE ficar associada à `Company` da usuária (conteúdo em nome da empresa) e aparecer na seção da empresa.
5. SE não houver thumbnail ENTÃO o sistema PODE usar um quadro do vídeo ou um placeholder com a identidade visual.

### Requisito 4 — Upload direto para o R2 com URL pré-assinada

**User Story:** Como empresa, quero subir vídeos grandes sem travar, para que o upload seja rápido e confiável.

#### Acceptance Criteria
1. O sistema DEVE gerar uma **URL pré-assinada** (via Django) para o navegador enviar o arquivo **direto ao R2**; o arquivo NÃO DEVE passar pelo backend.
2. O backend DEVE validar, na geração da URL, o **tipo** (apenas `video/mp4` e `video/webm`) e o **tamanho máximo (200 MB)**.
3. O frontend DEVE validar, antes do upload, a **duração máxima (10 min)** lendo os metadados do elemento `<video>`, e o tipo/tamanho.
4. O sistema DEVE exibir uma **barra de progresso** durante o upload.
5. QUANDO o upload termina ENTÃO o frontend DEVE confirmar ao backend a criação da aula com a chave/URL do objeto no R2.
6. O mesmo mecanismo de URL pré-assinada DEVE servir para a **thumbnail** (imagem), com validação de tipo de imagem e tamanho (ex.: 5 MB).
7. SE a validação de tipo/tamanho/duração falhar ENTÃO o sistema DEVE recusar com mensagem clara e NÃO iniciar o upload.

### Requisito 5 — Editar e excluir aula

**User Story:** Como empresa, quero editar e excluir meus próprios vídeos, para manter o conteúdo correto.

#### Acceptance Criteria
1. O sistema DEVE permitir **editar** título, descrição e thumbnail de uma aula **da própria empresa**.
2. O sistema DEVE permitir **excluir** uma aula da própria empresa (e remover o objeto do R2, ou marcar para remoção).
3. O sistema NÃO DEVE permitir que uma usuária edite/exclua aulas de outra empresa (403).
4. O admin DEVE poder remover qualquer aula pelo Django Admin.

### Requisito 6 — Player

**User Story:** Como usuária, quero assistir à aula com um player simples, para aprender sem distração.

#### Acceptance Criteria
1. O sistema DEVE exibir um **player** com controles nativos ao abrir uma aula.
2. O player DEVE mostrar **título, descrição, nome da empresa** (ou "Por ELAS") e **data**.
3. O vídeo DEVE ser servido a partir do R2 (URL pública ou pré-assinada de leitura).

### Requisito 7 — Conta oficial "Por ELAS" e Básico com IA

**User Story:** Como equipe do app, quero publicar os vídeos de fundamentos em nome da conta oficial, para alimentar o "Básico com IA".

#### Acceptance Criteria
1. O sistema DEVE suportar aulas marcadas como **"Básico com IA"** (autor = conta oficial "Por ELAS"), publicadas pelo admin.
2. Essas aulas DEVEM aparecer na seção "Básico com IA" e no chip "IA Por ELAS".
3. O admin DEVE conseguir criar/editar essas aulas pelo Django Admin (upload via URL do R2 aceito como campo).

### Requisito 8 — Segurança e limites

**User Story:** Como responsável pelo produto, quero limitar o upload, para não estourar custo nem aceitar arquivos inválidos.

#### Acceptance Criteria
1. Apenas usuárias de empresa **aprovada** podem gerar URL pré-assinada de upload de vídeo.
2. A URL pré-assinada DEVE ter **expiração curta** (ex.: 5–10 min).
3. As chaves do R2 DEVEM ficar em variáveis de ambiente, nunca no front nem no Git.
4. O backend DEVE restringir o `Content-Type` e o tamanho na política da URL pré-assinada.
