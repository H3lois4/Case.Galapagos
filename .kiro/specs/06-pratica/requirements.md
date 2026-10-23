# Requisitos — 06-pratica

## Introdução

Esta etapa entrega a tela **Prática**, com duas ferramentas:

1. **Simulados de múltipla escolha** por tema — questões curadas de um **seed** (sem IA), 10 por rodada, cronômetro opcional, nota, explicação por resposta e histórico.
2. **Simulador de entrevista com IA** — a usuária define a vaga/contexto, a IA conduz 6–10 perguntas (uma por vez, sem dar feedback durante), e ao encerrar gera um **relatório estruturado** (JSON com schema fixo), salvo no histórico e exportável em PDF.

Reaproveita a fundação de IA (`03-ia-base`) para a entrevista e o padrão de seed/PDF das etapas anteriores. Depende de `00-fundacao`, `01-auth-perfis` e `03-ia-base`.

## Requisitos

### Requisito 1 — Temas de simulado

**User Story:** Como usuária, quero escolher um tema de simulado, para treinar o que me interessa.

#### Acceptance Criteria
1. O sistema DEVE oferecer os temas: **Mercado financeiro, Certificações/CPA, Matemática financeira, Excel, Programação/Python e Inglês**.
2. O sistema DEVE mostrar quantas questões há por tema.
3. As questões DEVEM vir de um **arquivo de seed editável** (JSON), carregável por um comando de management.
4. O seed DEVE vir com **pelo menos uma questão por tema** já funcional.

### Requisito 2 — Fazer um simulado

**User Story:** Como usuária, quero responder um simulado, para medir meu conhecimento.

#### Acceptance Criteria
1. QUANDO a usuária inicia um simulado de um tema ENTÃO o sistema DEVE montar uma rodada de até **10 questões** daquele tema (aleatórias se houver mais que 10).
2. As questões entregues ao cliente **NÃO DEVEM** conter o gabarito nem a explicação (evitar "colar" pelo DevTools).
3. A tela DEVE permitir responder cada questão (uma alternativa por questão) e **finalizar**.
4. O sistema DEVE oferecer um **cronômetro opcional** (a usuária escolhe usar ou não); o tempo é informativo, não bloqueia o envio.
5. SE o tema não tiver questões ENTÃO o sistema DEVE informar de forma clara.

### Requisito 3 — Correção e resultado

**User Story:** Como usuária, quero ver minha nota e entender os erros, para aprender.

#### Acceptance Criteria
1. A correção DEVE ser feita **no backend** (o gabarito nunca sai antes do envio).
2. O resultado DEVE mostrar a **nota** (acertos/total) e, por questão, a alternativa escolhida, a **correta** e a **explicação**.
3. Cada tentativa DEVE ser **salva no histórico** da usuária (tema, nota, data).

### Requisito 4 — Entrevista simulada com IA

**User Story:** Como usuária, quero treinar entrevista com uma IA, para me preparar para processos seletivos.

#### Acceptance Criteria
1. Antes de começar, a usuária DEVE preencher: **vaga/empresa**, **papel do entrevistador**, **tipo de entrevista**, **nível** e (opcional) **descrição da vaga**.
2. A IA DEVE conduzir **6–10 perguntas**, **uma por vez**, e **não** dar feedback durante a entrevista.
3. A conversa DEVE usar o chat da etapa 03 (texto e voz), com streaming.
4. SE a entrevista for em inglês ENTÃO as perguntas DEVEM ser em inglês (e a voz pode usar `en-US`).

### Requisito 5 — Relatório de feedback

**User Story:** Como usuária, quero um relatório ao fim da entrevista, para saber onde melhorar.

#### Acceptance Criteria
1. QUANDO a usuária encerra a entrevista ENTÃO o sistema DEVE gerar um **relatório em JSON** com o schema fixo: `nota_geral`, `pontos_fortes[]`, `melhorias[]`, `por_pergunta[{pergunta, resumo_resposta, avaliacao, sugestao}]`, `proximos_passos[]`.
2. O frontend DEVE **renderizar** o relatório e permitir **exportar em PDF** com a identidade visual.
3. O relatório DEVE ser **salvo no histórico** da usuária.
4. SE a IA não devolver um JSON válido ENTÃO o sistema DEVE avisar de forma clara (sem quebrar).

### Requisito 6 — Histórico no perfil

**User Story:** Como usuária, quero ver meu histórico de prática, para acompanhar minha evolução.

#### Acceptance Criteria
1. O perfil DEVE mostrar o **histórico de simulados** (tema, nota, data) e de **entrevistas** (vaga, nota geral, data).
2. A usuária DEVE poder reabrir o relatório de uma entrevista anterior.

### Requisito 7 — Segurança

#### Acceptance Criteria
1. Só usuária **autenticada** acessa simulados, entrevista e históricos.
2. Uma usuária só vê o **próprio** histórico e os próprios relatórios (403/404).
3. A entrevista com IA respeita o **rate limit** da etapa 03.
4. O gabarito das questões **nunca** é exposto antes do envio das respostas.
