# Requisitos — 04-carreira

## Introdução

Esta etapa entrega a tela **Carreira**: um guia das **áreas do mercado financeiro** e uma **IA de planejamento de carreira** (texto e voz) que ajuda a usuária a definir próximos passos — temas de estudo, certificações e cargos de entrada — e pode salvar um **Plano de carreira** no perfil. Cada área tem um modal com detalhes e botão **"Baixar PDF"** com a identidade visual.

Reaproveita a fundação de IA (`03-ia-base`): adiciona o **agente "carreira"** (prompt + base de conhecimento) e usa o componente de chat com voz já pronto. O conteúdo das áreas vem de um **seed editável** (JSON) versionado. Depende de `00-fundacao`, `01-auth-perfis` e `03-ia-base`.

## Requisitos

### Requisito 1 — Áreas do mercado financeiro (grade)

**User Story:** Como usuária, quero conhecer as áreas do mercado financeiro, para descobrir onde posso atuar.

#### Acceptance Criteria
1. O sistema DEVE exibir uma **grade de áreas** (cards) na tela Carreira, visível para qualquer usuária autenticada.
2. A grade DEVE conter, no mínimo: Investment Banking (DCM, ECM, M&A), Asset Management, Wealth Management/Private, Tecnologia, Trading/Sales & Trading, Quant, Research/Análise, Risco & Compliance, Crédito e Relações com Investidores.
3. Cada card DEVE mostrar nome e um resumo curto da área.
4. O conteúdo das áreas DEVE vir de um **arquivo de seed editável** (JSON), carregável por um comando de management.

### Requisito 2 — Detalhe da área (modal)

**User Story:** Como usuária, quero ver os detalhes de uma área, para entender o que é preciso para entrar nela.

#### Acceptance Criteria
1. QUANDO a usuária toca numa área ENTÃO o sistema DEVE abrir um **modal** com: descrição, formação comum, cursos e certificações, hard skills, soft skills e cargos de entrada.
2. O modal DEVE listar **mulheres que atuam na área** com **link para o LinkedIn** (placeholders no MVP).
3. As certificações exibidas DEVEM contemplar as locais e internacionais relevantes (ex.: CPA-20, CEA, CFP, CGA, CFA, FRM).
4. O modal DEVE ser acessível (foco, fechar por botão/ESC) e legível no celular.

### Requisito 3 — Baixar PDF da área

**User Story:** Como usuária, quero baixar um PDF da área, para estudar offline e compartilhar.

#### Acceptance Criteria
1. O modal DEVE ter um botão **"Baixar PDF"**.
2. O PDF DEVE conter os dados da área (descrição, formação, certificações, skills, cargos de entrada, mulheres de referência) com a **identidade visual** do Por ELAS finance.
3. SE a geração falhar ENTÃO o sistema DEVE avisar de forma clara.

### Requisito 4 — IA de planejamento de carreira

**User Story:** Como usuária, quero conversar com uma IA que me ajude a planejar minha carreira, para ter próximos passos claros.

#### Acceptance Criteria
1. A tela Carreira DEVE oferecer um **chat com a IA de carreira** (texto e voz), usando o componente de chat da etapa 03.
2. A IA DEVE perguntar sobre formação, experiência, tempo disponível, área de interesse e objetivo, e sugerir **trilha de estudos, certificações em ordem, cargos de entrada e prazos**.
3. A IA DEVE seguir as regras globais (pt-BR, tom acolhedor, não recomendar investimento específico, não inventar fatos).
4. A IA DEVE conhecer as áreas e as certificações (base de conhecimento) para dar respostas coerentes com o guia.

### Requisito 5 — Plano de carreira salvo

**User Story:** Como usuária, quero salvar um plano de carreira, para acompanhar meus passos ao longo do tempo.

#### Acceptance Criteria
1. A IA DEVE poder **gerar um Plano de carreira estruturado** (lista de passos com título, descrição e prazo), a partir da conversa.
2. A usuária DEVE poder **salvar** o plano; o plano fica ligado ao perfil (um plano "ativo" por usuária, substituível).
3. O plano salvo DEVE aparecer como **checklist no Perfil** ("Minha jornada"/"Plano de carreira"), com a usuária podendo **marcar passos como concluídos**.
4. A usuária DEVE poder **gerar um novo plano** (substitui o anterior) e **excluir** o plano.
5. Uma usuária NÃO DEVE acessar o plano de outra (403/404).

### Requisito 6 — Segurança e conteúdo

#### Acceptance Criteria
1. Só usuária **autenticada** acessa o chat de carreira e o plano; as áreas são visíveis a qualquer autenticada.
2. Os links de LinkedIn das mulheres de referência são **placeholders editáveis** no seed; o sistema NÃO DEVE inventar perfis reais.
3. A IA de carreira respeita o **rate limit** da etapa 03.
