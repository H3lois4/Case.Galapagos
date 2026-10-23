# Design — 03-ia-base

## Visão geral

A camada `backend/ai/` abstrai o provedor de LLM atrás de uma função única e entrega as respostas em **streaming SSE**. Cada agente é definido por um **prompt de sistema** (`.md`) mais uma **base de conhecimento** (`.md`) injetada no prompt. As conversas ficam no banco (memória). O frontend tem **um componente de chat** com voz, reutilizado pelos agentes das próximas etapas.

```
Usuária ─(texto/voz)→ ChatIA (frontend)
   │  POST /api/ai/chat/  (SSE)
   ▼
Django DRF ── monta system = regras globais + prompt do agente + conhecimento + contexto da usuária
          ── anexa histórico da Conversation
          ── chama provider.chat(messages, system, stream=True)
          ── repassa os chunks como eventos SSE "token"/"done"/"error"
   ▲
Provedor (Gemini padrão | OpenAI | Anthropic)
```

> **Não** treinamos modelo. "Treinar" = editar os `.md` de prompt/conhecimento. RAG com embeddings fica **preparado mas desligado** (ver "Crescimento").

## Backend (`ai/`)

### Dependências novas (`requirements.txt`)
- `google-genai` (SDK atual do Gemini). OpenAI/Anthropic entram só se forem usados (adaptadores com import preguiçoso).

### Configuração / env
```
LLM_PROVIDER=gemini            # gemini | openai | anthropic
LLM_MODEL=gemini-2.5-flash     # modelo padrão (trocável sem código)
GEMINI_API_KEY=...
OPENAI_API_KEY=                # opcional
ANTHROPIC_API_KEY=             # opcional
AI_RATE_LIMIT_PER_HOUR=30      # mensagens por usuária por hora
AI_MAX_HISTORY=20              # nº de mensagens recentes enviadas ao modelo
AI_REQUEST_TIMEOUT=60
```
> Modelo padrão `gemini-2.5-flash` (estável e no free tier em out/2026; `gemini-2.0-flash` está em descontinuação). Como o modelo é variável de ambiente, atualizar é trocar o `.env`.

### Provedores (`ai/providers/`)
Interface mínima:
```python
class LLMProvider(Protocol):
    def chat(self, messages: list[dict], system: str,
             stream: bool = True, **kw) -> Iterator[str]: ...
```
- `messages`: `[{"role": "user"|"assistant", "content": "..."}]`.
- `chat` devolve um **iterador de pedaços de texto** (streaming). Sem stream, devolve 1 pedaço.
- `base.py` define o Protocol e `get_provider()` (fábrica por `LLM_PROVIDER`, com cache).
- `gemini.py` (padrão): usa `google-genai`, `generate_content_stream`, mapeia `system` para system instruction e converte papéis (`assistant`→`model`).
- `openai.py` e `anthropic.py`: adaptadores equivalentes, import preguiçoso, só exigidos quando selecionados.
- Erros do provedor viram `ProviderError` (tratado como evento SSE de erro / 503 na criação).

### Registro de agentes (`ai/agents.py`)
```python
@dataclass(frozen=True)
class Agente:
    chave: str                 # "assistente", "carreira", ...
    nome: str
    prompt_file: str           # ai/prompts/<chave>.md
    knowledge_dir: str | None  # ai/knowledge/<chave>/
    temperatura: float = 0.7

AGENTES = {a.chave: a for a in [...]}
```
`montar_system(agente, profile, resumo)` monta o system final:
1. **Regras globais** (pt-BR, tom acolhedor, não recomendar investimento, não inventar fatos, não pedir dados sensíveis, acolher em saúde mental) — constante única reaproveitada.
2. Prompt do agente (lido do `.md`, com cache em memória).
3. Base de conhecimento concatenada (todos os `.md` da pasta).
4. Contexto da usuária (nome, tipo de conta, empresa) e resumo da conversa anterior, se houver.

Prompts/knowledge lidos uma vez e cacheados (em produção serverless, por instância). Esta etapa cria só o agente **`assistente`**; carreira/mentora/entrevistadora entram nas etapas 04–06 adicionando arquivos e uma entrada no registro.

### Modelos (`ai/models.py`)
```python
class Conversation(models.Model):
    profile = FK(Profile, related_name="conversas")
    agente = CharField(max_length=40)          # chave do agente
    titulo = CharField(max_length=160, blank=True)
    resumo = TextField(blank=True)             # memória curta
    criado_em / atualizado_em

class Message(models.Model):
    PAPEL = [("user","Usuária"), ("assistant","IA")]
    conversation = FK(Conversation, related_name="mensagens")
    papel = CharField(max_length=10, choices=PAPEL)
    conteudo = TextField()
    ordem = PositiveIntegerField()
    criado_em

class MessageFeedback(models.Model):
    message = OneToOne(Message, related_name="feedback")
    profile = FK(Profile)
    util = BooleanField()                      # 👍 True / 👎 False
    criado_em
```
Índices por `(profile, agente)` e `(conversation, ordem)`. Admin: `ConversationAdmin`, `MessageFeedbackAdmin` (lista util/agente/data).

### Rate limit (`ai/ratelimit.py`)
Contagem de `Message` com `papel="user"` da usuária na última hora (sem dependência externa; funciona em serverless pois lê do banco). ≥ `AI_RATE_LIMIT_PER_HOUR` → 429 com `retry_after`.

### Endpoints (`/api/ai/`)
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/ai/agentes/` | Lista agentes disponíveis (chave, nome). |
| GET | `/api/ai/conversas/?agente=` | Conversas da usuária para um agente. |
| POST | `/api/ai/conversas/` | Cria conversa (agente). |
| GET | `/api/ai/conversas/<id>/` | Mensagens da conversa (dono). |
| POST | `/api/ai/chat/` | **SSE.** Body: `conversa_id?`, `agente`, `mensagem`. Cria conversa se faltar, salva a mensagem da usuária, faz stream da resposta e salva a mensagem da IA ao final. |
| POST | `/api/ai/mensagens/<id>/feedback/` | 👍/👎 (`util: bool`). |
| POST | `/api/ai/conversas/<id>/resumo/` | (Re)gera o resumo da conversa. |

SSE via `StreamingHttpResponse` com `content_type="text/event-stream"`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`. Eventos: `event: token` (data: pedaço), `event: done` (data: `{message_id}`), `event: error` (data: `{detail}`). A mensagem da IA só é persistida quando o stream termina ok; o rate limit é checado **antes** de abrir o stream.

Permissão: `IsAuthenticated` + dono da conversa. Rota de chat valida o agente contra `AGENTES`.

## Frontend

### Cliente de streaming (`lib/aiChat.ts`)
`streamChat({agente, conversaId, mensagem, onToken, onDone, onError})` usa `fetch` com `ReadableStream` (POST + SSE manual, já que `EventSource` não faz POST com header Bearer). Lê o corpo em chunks, separa por `\n\n`, parseia `event:`/`data:`.

### Voz (`lib/voz.ts`)
Fina camada sobre a Web Speech API: `reconhecer({lang, onResultado, onFim})` (SpeechRecognition) e `falar(texto, {lang})` (speechSynthesis). Detecta suporte e expõe `vozDisponivel`.

### Componente de chat (`components/ia/ChatIA.tsx`)
Props: `agente`, `titulo`, `conversaIdInicial?`. Estado: lista de mensagens, rascunho, streaming, gravando, modoVoz. UI (design system): balões usuária/IA, campo com botões **microfone** e **enviar**, no topo "Nova conversa" e histórico; por resposta da IA, 👍/👎 e **ouvir**. Streaming anexa tokens à última mensagem da IA. Avisos de erro/limite claros. Sem suporte a voz → esconde microfone/ouvir e avisa.

Componentes de apoio: `BolhaMensagem`, `BotaoMicrofone`, `ListaConversas`.

### Rota de demonstração
Página `app/(app)/assistente/page.tsx` (link discreto no Perfil, seção Diagnóstico) renderizando `<ChatIA agente="assistente" />` — prova texto, streaming e voz ponta a ponta. Não entra na navegação principal.

## Crescimento (preparado, desligado)
`montar_system` concatena todo o conhecimento hoje. Quando a base crescer: ligar RAG com **pgvector** no Supabase (tabela de embeddings + busca por similaridade) e injetar só os trechos relevantes. A interface dos agentes e o frontend não mudam. Fora do escopo desta etapa.

## Estratégia de verificação
- Testes backend: fábrica de provedor por env; `montar_system` inclui regras globais + conhecimento + contexto; rate limit retorna 429 no limite; dono-only nas conversas; feedback grava 👍/👎. Provedor **mockado** (sem rede nos testes) para validar o SSE (sequência token→done) e a persistência da mensagem da IA.
- Teste manual com `GEMINI_API_KEY` real: conversa por texto, streaming visível, voz (ditar e ouvir), 👍/👎, nova conversa.
- `check`, `migrate`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Telas finais de Carreira, Mentoria e Prática (etapas 04–06) e a IA de notícias/cron (etapa 07).
- RAG com embeddings (só preparado).
- Geração de imagens/áudio pela IA (voz é do navegador, via Web Speech API).
