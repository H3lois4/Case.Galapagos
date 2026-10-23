# Tarefas — 03-ia-base

- [x] 1. Provedor de LLM e configuração
- [x] 1.1 Interface e fábrica de provedor (`ai/providers/base.py`)
  - `LLMProvider` (Protocol) com `chat(messages, system, stream)`; `get_provider()` por `LLM_PROVIDER`; `ProviderError`.
  - Settings/env: `LLM_PROVIDER`, `LLM_MODEL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_RATE_LIMIT_PER_HOUR`, `AI_MAX_HISTORY`, `AI_REQUEST_TIMEOUT`; `.env.example`.
  - _Requisitos: 1.1, 1.2, 1.4, 1.6_
- [x] 1.2 Adaptador Gemini (`ai/providers/gemini.py`) + stubs OpenAI/Anthropic
  - `google-genai` com `generate_content_stream`; mapear system e papéis; import preguiçoso; erro claro sem chave.
  - `google-genai` em `requirements.txt`.
  - _Requisitos: 1.3, 1.5, 2.1_

- [x] 2. Agentes, prompts e conhecimento
- [x] 2.1 Registro de agentes e montagem do system (`ai/agents.py`)
  - `Agente` (dataclass), `AGENTES`, regras globais, `montar_system(agente, profile, resumo)` com cache de leitura dos `.md`.
  - _Requisitos: 3.1, 3.3, 3.4, 3.6, 4.3_
- [x] 2.2 Prompt do agente de demonstração
  - `ai/prompts/assistente.md` (apresenta a plataforma, tira dúvidas gerais) e pasta `ai/knowledge/assistente/` com visão do produto.
  - _Requisitos: 3.1, 3.2, 8.1_

- [x] 3. Conversas, memória e endpoints
- [x] 3.1 Modelos + admin + migração
  - `Conversation`, `Message`, `MessageFeedback`; índices; `ConversationAdmin`, `MessageFeedbackAdmin`.
  - _Requisitos: 4.1, 7.1, 7.2_
- [x] 3.2 Rate limit (`ai/ratelimit.py`)
  - Conta `Message` user na última hora; 429 com `retry_after`.
  - _Requisitos: 5.1, 5.2, 5.3_
- [x] 3.3 Endpoints de conversas e feedback
  - Listar/criar conversa, ver mensagens (dono), feedback 👍/👎, (re)gerar resumo.
  - _Requisitos: 4.2, 4.4, 4.5, 4.6, 7.1_
- [x] 3.4 Endpoint de chat SSE (`POST /api/ai/chat/`)
  - Valida agente, checa rate limit, salva msg da usuária, monta system+histórico, faz stream (token/done/error), persiste msg da IA ao final.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 4.2, 9.1_
- [x] 3.5 Testes do backend
  - Fábrica por env; `montar_system` (regras+conhecimento+contexto); rate limit 429; dono-only; feedback; SSE com provedor mockado (token→done) e persistência da msg da IA. (15 testes)
  - _Requisitos: 1.2, 2.1, 4.6, 5.2, 7.1_

- [x] 4. Frontend — streaming, voz e chat
- [x] 4.1 Cliente SSE (`lib/aiChat.ts`) e voz (`lib/voz.ts`)
  - `streamChat` via fetch/ReadableStream com Bearer; `reconhecer`/`falar` sobre Web Speech API + detecção de suporte.
  - _Requisitos: 2.2, 6.2, 6.3, 6.4_
- [x] 4.2 Componente `ChatIA` + apoio
  - Lista de mensagens com streaming, campo, microfone, enviar, nova conversa, 👍/👎, ouvir, modo conversa por voz; estados de carregando/erro/limite.
  - _Requisitos: 6.1, 6.5, 6.6, 7.1_
- [x] 4.3 Rota de demonstração
  - `app/(app)/assistente/page.tsx` com `<ChatIA agente="assistente" />`; link discreto no Perfil (Diagnóstico).
  - _Requisitos: 8.2_

- [x] 5. Verificação e documentação
- [x] 5.1 Verificar tudo
  - `check`, `migrate`, testes (45 ok), `npm run build`/`lint` verdes.
  - Teste manual com `GEMINI_API_KEY` real (texto, streaming, voz, feedback, nova conversa): pendente da chave do Gemini. Sem a chave, o chat responde erro claro.
  - _Requisitos: 2.1, 6.1 (validação geral)_
- [x] 5.2 README: seção de IA
  - Variáveis `LLM_*`/chaves, como trocar provedor/modelo, onde ficam prompts/knowledge, limite de uso.
  - _Requisitos: 1.2, 3.5_

- [ ] 6. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
