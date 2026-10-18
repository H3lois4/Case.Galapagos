# Agentes de IA

## Arquitetura comum

- Módulo `backend/ai/` com interface única `chat(messages, system, stream=True)` e implementações para **Gemini, Anthropic e OpenAI** selecionadas por `LLM_PROVIDER` e `LLM_MODEL`. Respostas em **streaming (SSE)** para o frontend.
- Cada agente tem:
  - **prompt de sistema** em arquivo `.md` versionado (`backend/ai/prompts/`),
  - **base de conhecimento** em arquivos `.md` (`backend/ai/knowledge/<agente>/`),
  - acesso ao **contexto da usuária** (tipo de conta, objetivos, área de interesse, plano de carreira salvo, resumo das conversas anteriores).
- **Base de conhecimento (MVP):** como os textos são pequenos, inserir os arquivos relevantes direto no prompt do agente. Deixar preparado (mas opcional) um modo RAG com embeddings em Postgres + pgvector para quando a base crescer.
- Conversas salvas no banco (`Conversation`, `Message`), com histórico visível e botão "nova conversa". Ao fim de cada conversa, salvar um **resumo curto** para dar memória às próximas.
- **Componente de chat único** no frontend, reutilizado pelos agentes: campo de texto, botão de microfone (Web Speech API, `pt-BR` padrão), botão para ouvir a resposta em voz, indicador "ouvindo…" e modo "conversa por voz" (fala → transcreve → envia → lê a resposta → volta a ouvir).
- Botões 👍/👎 em cada resposta, salvos no banco para melhorar os prompts.

## Regras gerais em todos os prompts de sistema

- Responder em **português do Brasil** (ou inglês quando a usuária pedir).
- Tom acolhedor e direto.
- **Não** fazer recomendação de investimento específico.
- **Não** inventar fatos sobre empresas, vagas ou pessoas; quando não souber, dizer que não sabe.
- Nunca pedir dados sensíveis.
- Em temas de saúde mental grave, acolher e sugerir apoio profissional.

## Agentes

### IA de carreira (tela Carreira)
Planejadora. Pergunta sobre formação, experiência, tempo disponível, área de interesse e objetivo. Sugere trilha de estudos, certificações em ordem, cargos de entrada e prazos. Pode gerar e salvar um "Plano de carreira" estruturado (JSON → checklist no perfil). Base de conhecimento: fichas das áreas + guia de certificações.

### IA mentora (tela Mentoria)
Conselheira. Opiniões e direcionamentos sobre decisões de carreira, negociação, posicionamento, networking e insegurança em ambiente masculino. Conhece as três personas (retorno após pausa, primeira entrada, transição de carreira após os 40) para adaptar o tom. Quando fizer sentido, sugere agendar uma mentoria humana.

### IA entrevistadora (tela Prática)
Interpreta o papel escolhido, faz uma pergunta por vez, adapta o nível e **não** dá feedback durante a entrevista. Ao encerrar, gera relatório em JSON com esquema fixo:
`nota_geral`, `pontos_fortes[]`, `melhorias[]`, `por_pergunta[{pergunta, resumo_resposta, avaliacao, sugestao}]`, `proximos_passos[]`.
O frontend renderiza e exporta em PDF. Base: banco de perguntas por tipo de entrevista e por área.

### IA de notícias (tela Rede)
Job diário (Vercel Cron → `POST /api/ai/news/run/` protegido por `CRON_SECRET`; processar poucas notícias por execução por causa do tempo máximo das funções). Lê feeds RSS do mercado (lista configurável), escolhe 3–5 assuntos relevantes e escreve, **com palavras próprias**, um resumo curto (até 120 palavras) por assunto, com título, categoria e **link para a fonte original**. **Não copiar trechos**. Imagem do card: ilustração própria por categoria (juros, bolsa, câmbio, cripto, carreira) com as cores da marca. Publica como posts `noticia` com autor "IA Por ELAS". Deve haver um botão no admin para rodar manualmente.
