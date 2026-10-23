# Requisitos — 03-ia-base

## Introdução

Esta etapa entrega a **fundação de IA** do Por ELAS finance: a camada que as telas de Carreira (04), Mentoria (05) e Prática (06) e a IA de notícias (07) vão consumir. Nada de treinar modelo próprio — usamos um **LLM pronto** (padrão **Gemini Flash**, plano gratuito), "treinado" por **prompt de sistema** + **base de conhecimento** em arquivos versionados. A resposta chega em **streaming (SSE)** e o frontend tem um **componente de chat único** reutilizável, com **voz** (Web Speech API).

Esta etapa **não** constrói as telas finais dos agentes; entrega o motor, os modelos de conversa, um endpoint de chat genérico e o componente de chat. Um agente de demonstração ("assistente") valida tudo ponta a ponta.

Depende de `00-fundacao` e `01-auth-perfis`. Reaproveita `Profile` e a autenticação por JWT.

## Requisitos

### Requisito 1 — Provedor de LLM trocável

**User Story:** Como time do app, quero trocar de provedor/modelo de IA por variável de ambiente, para não depender de uma única cota gratuita.

#### Acceptance Criteria
1. O sistema DEVE expor uma interface única `chat(messages, system, stream=True)` independente do provedor.
2. O sistema DEVE selecionar o provedor por `LLM_PROVIDER` (`gemini` | `openai` | `anthropic`) e o modelo por `LLM_MODEL`.
3. O provedor padrão DEVE ser **Gemini**, com modelo padrão `gemini-2.5-flash`.
4. As chaves de API DEVEM vir de variáveis de ambiente, nunca do front nem do Git.
5. SE o provedor não estiver configurado (sem chave) ENTÃO o endpoint de chat DEVE responder erro claro (503) sem derrubar o resto do app.
6. A troca de provedor/modelo NÃO DEVE exigir mudança no código dos agentes nem no frontend.

### Requisito 2 — Respostas em streaming (SSE)

**User Story:** Como usuária, quero ver a resposta surgindo em tempo real, para a conversa parecer natural.

#### Acceptance Criteria
1. O endpoint de chat DEVE responder em **Server-Sent Events**, enviando pedaços (tokens) conforme o modelo gera.
2. O frontend DEVE renderizar o texto incrementalmente e indicar quando a resposta terminou.
3. SE o provedor falhar no meio do stream ENTÃO o sistema DEVE enviar um evento de erro e encerrar o stream com mensagem clara.
4. O streaming DEVE funcionar no runtime serverless da Vercel (resposta única, sem processos em segundo plano).

### Requisito 3 — Agentes com prompt e base de conhecimento versionados

**User Story:** Como time do app, quero ajustar o comportamento das IAs editando arquivos de texto, para "treinar" sem reimplementar nada.

#### Acceptance Criteria
1. Cada agente DEVE ter um **prompt de sistema** em `backend/ai/prompts/<agente>.md`.
2. Cada agente PODE ter uma **base de conhecimento** em `backend/ai/knowledge/<agente>/*.md`.
3. No MVP, o sistema DEVE **injetar a base de conhecimento no prompt de sistema** (sem busca semântica).
4. O registro de agentes DEVE declarar, por agente: chave, prompt, pasta de conhecimento e parâmetros (ex.: temperatura).
5. Editar um `.md` e reiniciar/recarregar DEVE alterar o comportamento do agente, sem mudança de código.
6. O sistema DEVE aplicar **regras globais** (responder em pt-BR, tom acolhedor, não recomendar investimento específico, não inventar fatos, não pedir dados sensíveis) a todos os agentes.

### Requisito 4 — Conversas e memória

**User Story:** Como usuária, quero que a IA lembre do contexto da nossa conversa, para não repetir tudo a cada mensagem.

#### Acceptance Criteria
1. O sistema DEVE persistir `Conversation` (usuária, agente, título, resumo) e `Message` (papel, conteúdo, ordem, data).
2. O endpoint de chat DEVE aceitar uma conversa existente ou criar uma nova, e DEVE anexar o histórico ao enviar ao modelo.
3. O sistema DEVE injetar **contexto da usuária** (tipo de conta, nome, empresa) no prompt.
4. Ao encerrar/continuar, o sistema DEVE poder gerar um **resumo curto** da conversa e salvá-lo para reaproveitar como memória.
5. A usuária DEVE poder listar suas conversas de um agente, abrir uma e iniciar uma **nova conversa**.
6. Uma usuária NÃO DEVE acessar conversas de outra usuária (403/404).

### Requisito 5 — Limite de uso (rate limit)

**User Story:** Como responsável pelo produto, quero limitar o uso da IA, para não estourar a cota gratuita.

#### Acceptance Criteria
1. O sistema DEVE limitar mensagens por usuária (padrão **30 por hora**, configurável por env).
2. QUANDO o limite é atingido ENTÃO o endpoint DEVE responder 429 com mensagem clara e tempo de espera.
3. O limite DEVE ser por usuária autenticada (não global).

### Requisito 6 — Componente de chat no frontend (texto + voz)

**User Story:** Como usuária, quero conversar com a IA por texto ou por voz, para usar do jeito que for mais confortável.

#### Acceptance Criteria
1. O frontend DEVE ter **um componente de chat reutilizável** por todos os agentes (campo de texto, enviar, lista de mensagens com streaming).
2. O componente DEVE oferecer **ditado por voz** (Web Speech API, `pt-BR` padrão) com indicador "ouvindo…".
3. O componente DEVE oferecer **ouvir a resposta** em voz (síntese de fala) e um **modo conversa por voz** (fala → transcreve → envia → lê a resposta → volta a ouvir).
4. SE o navegador não suportar voz ENTÃO o componente DEVE avisar e manter o modo texto disponível.
5. O componente DEVE exibir **botões 👍/👎** por resposta, enviados ao backend.
6. O componente DEVE permitir **nova conversa** e exibir estado de carregando/erro de forma clara.

### Requisito 7 — Feedback das respostas

**User Story:** Como time do app, quero coletar 👍/👎 das respostas, para melhorar os prompts.

#### Acceptance Criteria
1. O sistema DEVE registrar feedback (positivo/negativo) por mensagem da IA, ligado à usuária e à mensagem.
2. O admin DEVE conseguir visualizar o feedback pelo Django Admin.

### Requisito 8 — Agente de demonstração

**User Story:** Como time do app, quero um agente simples já plugado, para validar o motor antes das telas de produto.

#### Acceptance Criteria
1. O sistema DEVE registrar um agente "assistente" com prompt próprio que apresenta o Por ELAS finance e tira dúvidas gerais sobre a plataforma.
2. DEVE existir uma rota de teste no app (ex.: dentro de Perfil ou uma página oculta) que usa o componente de chat com esse agente, provando texto, streaming e voz.

### Requisito 9 — Segurança e privacidade

#### Acceptance Criteria
1. Só usuária **autenticada** acessa os endpoints de IA.
2. Os prompts NÃO DEVEM pedir dados sensíveis; o conteúdo trafega sob HTTPS e CORS já configurado.
3. Em temas de saúde mental grave, o comportamento padrão DEVE acolher e sugerir apoio profissional (regra global de prompt).
