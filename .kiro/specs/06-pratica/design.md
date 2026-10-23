# Design — 06-pratica

## Visão geral

Dois blocos independentes na tela Prática:

- **Simulados** (sem IA): questões curadas em seed → tentativa com correção no servidor → nota + explicações + histórico.
- **Entrevista com IA** (etapa 03): setup → chat (6–10 perguntas) → relatório JSON → PDF + histórico.

```
Simulado: seed questions.json → seed_questions → Question
          POST /simulados/ (tema) → sorteia 10 (SEM gabarito) + QuizAttempt(aberta)
          POST /simulados/<id>/responder/ → corrige no server → nota + revisão + salva
Entrevista: POST /entrevistas/ (setup) → Conversation(agente=entrevistadora) + Interview
            chat via /api/ai/chat/ (etapa 03)
            POST /entrevistas/<id>/relatorio/ → IA → JSON schema fixo → salva → PDF no cliente
```

## Backend (`practice/`)

### Modelos (`practice/models.py`)
```python
class Question(models.Model):
    tema = CharField(max_length=40, db_index=True)        # slug do tema
    enunciado = TextField()
    alternativas = JSONField(default=list)                # ["a","b","c","d"]
    correta = PositiveSmallIntegerField()                 # índice (0-based)
    explicacao = TextField(blank=True)
    chave = CharField(max_length=64, unique=True)         # p/ upsert idempotente do seed
    ativo = BooleanField(default=True)

class QuizAttempt(models.Model):
    profile = FK(Profile, related_name="simulados")
    tema = CharField(max_length=40)
    questao_ids = JSONField(default=list)                 # ordem das questões da rodada
    respostas = JSONField(default=dict)                   # {questao_id: indice}
    nota = PositiveSmallIntegerField(default=0)           # acertos
    total = PositiveSmallIntegerField(default=0)
    finalizado = BooleanField(default=False)
    criado_em / finalizado_em

class Interview(models.Model):
    profile = FK(Profile, related_name="entrevistas")
    conversation = FK("ai.Conversation", null=True, on_delete=SET_NULL)
    vaga = CharField(max_length=160)
    papel_entrevistador = CharField(max_length=120, blank=True)
    tipo = CharField(max_length=60, blank=True)           # comportamental, técnica...
    nivel = CharField(max_length=40, blank=True)
    idioma = CharField(max_length=10, default="pt")       # pt | en
    descricao = TextField(blank=True)
    relatorio = JSONField(null=True, blank=True)          # schema fixo
    nota_geral = PositiveSmallIntegerField(null=True, blank=True)
    criado_em / finalizado_em
```
Admin: `QuestionAdmin` (editável, filtro por tema), `QuizAttemptAdmin` e `InterviewAdmin` (leitura).

### Temas (`practice/temas.py`)
Constante com os 6 temas (slug + rótulo): `mercado-financeiro`, `certificacoes`, `matematica-financeira`, `excel`, `programacao-python`, `ingles`.

### Seed de questões (`practice/data/questions.json` + `seed_questions`)
JSON versionado com **ao menos uma questão por tema** (começaremos com ~1–3 por tema, funcionais). `chave` estável por questão para upsert idempotente (igual a `seed_areas`). Command `seed_questions` faz `update_or_create` por `chave`.

### Simulado — montagem e correção (`practice/services_quiz.py`)
- `iniciar(profile, tema)`: valida tema; pega questões ativas do tema, embaralha e corta em 10; cria `QuizAttempt(finalizado=False, questao_ids=[...])`; devolve as questões **públicas** (sem `correta`/`explicacao`).
- `corrigir(attempt, respostas)`: se já finalizado, erro; compara `respostas` com o gabarito do banco; calcula nota; marca finalizado; devolve revisão por questão (escolhida, correta, explicacao, acertou).
- Serializer público de questão **não inclui** `correta`/`explicacao`.

### Entrevista — agente e relatório
- Agente `entrevistadora` (etapa 03): `ai/prompts/entrevistadora.md` (uma pergunta por vez, sem feedback durante, adapta nível/idioma), `ai/knowledge/entrevistadora/` (dicas por tipo). O **system** de abertura recebe o contexto da vaga.
- `iniciar_entrevista(profile, dados)`: cria `Conversation(agente="entrevistadora")` com uma primeira mensagem de sistema/inject do contexto e cria `Interview` ligada. A conversa prossegue pelo `/api/ai/chat/` normal (frontend passa `conversa_id`).
  - Para injetar o contexto, criamos a conversa e gravamos o setup no `Interview`; o prompt da entrevistadora lê o contexto a partir da **primeira mensagem** (a usuária manda "começar") — simplificação: o setup é embutido como uma mensagem inicial do usuário gerada pelo cliente/serviço.
- `gerar_relatorio(interview)`: lê o histórico da conversa, chama o provedor **sem streaming** com um system que exige o **JSON do schema fixo**; valida/limpa (reaproveita a lógica de extração de JSON de carreira); salva `relatorio` e `nota_geral`. 422 se inválido.

### Endpoints (`/api/pratica/`)
| Método | Rota | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/pratica/temas/` | autenticada | Temas + contagem de questões. |
| POST | `/api/pratica/simulados/` | autenticada | Inicia (body: `tema`) → questões sem gabarito + `attempt_id`. |
| POST | `/api/pratica/simulados/<id>/responder/` | dona | Corrige e devolve nota + revisão. |
| GET | `/api/pratica/simulados/historico/` | autenticada | Tentativas finalizadas da usuária. |
| POST | `/api/pratica/entrevistas/` | autenticada | Setup → cria Interview + Conversation. |
| GET | `/api/pratica/entrevistas/<id>/` | dona | Detalhe (setup, conversa_id, relatório se houver). |
| POST | `/api/pratica/entrevistas/<id>/relatorio/` | dona | Gera/retorna o relatório (IA → JSON). |
| GET | `/api/pratica/entrevistas/historico/` | autenticada | Entrevistas da usuária. |

## Frontend (`app/(app)/pratica/`)

Abas: **Simulados** e **Entrevista com IA**.

### Simulados
- Grade de temas (`TemaCard` com contagem). Ao escolher → `Simulado`:
  - Toggle "usar cronômetro"; uma questão por vez (ou lista) com alternativas; navegação; "Finalizar".
  - Envia respostas; mostra `ResultadoSimulado`: nota + cada questão com certo/errado e explicação; botão "Refazer" / "Outro tema".
- Estado vazio quando o tema não tem questões.

### Entrevista com IA
- `EntrevistaSetup` (form: vaga, papel, tipo, nível, idioma, descrição) → cria a entrevista.
- Reusa `<ChatIA agente="entrevistadora" conversaId=... />` (passo a conversa criada no setup). Ajuste no `ChatIA`: aceitar `conversaIdInicial` e idioma de voz.
- Botão **"Encerrar e ver feedback"** → chama `/relatorio/` → `RelatorioEntrevista` (render + "Baixar PDF" via `lib/pdfRelatorio.ts`).

### Perfil
"Minha jornada" ganha **Histórico de simulados** (tema, nota, data) e **Entrevistas** (vaga, nota geral) — resumo compacto.

### Componentes
`TemaCard`, `Simulado`, `ResultadoSimulado`, `EntrevistaSetup`, `RelatorioEntrevista`, e extensão do `ChatIA`.

## Dependências
- Backend: nenhuma nova.
- Frontend: reusa `jspdf`.

## Estratégia de verificação
- Testes backend: `seed_questions` idempotente; temas + contagem; iniciar simulado (≤10, **sem gabarito** no payload); correção calcula nota certa e marca finalizado; não recorrige; dono-only no responder/histórico; gerar_relatorio com provedor **mockado** (JSON ok e inválido→422); dono-only nas entrevistas.
- Teste manual: simulado ponta a ponta (sem chave); entrevista + relatório dependem da `GEMINI_API_KEY`.
- `check`, `migrate`, `seed_questions`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Ranking/gamificação. Correção parcial/ponderada (cada questão vale 1).
- Banco extenso de questões (começamos com exemplos por tema; o JSON é expansível).
