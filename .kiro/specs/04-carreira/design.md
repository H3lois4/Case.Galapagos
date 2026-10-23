# Design — 04-carreira

## Visão geral

A tela Carreira junta duas coisas: um **guia de áreas** do mercado financeiro (dados de seed, modal de detalhe, PDF) e a **IA de carreira** (agente novo sobre a base da etapa 03) que pode gerar e salvar um **Plano de carreira** como checklist no perfil.

```
Áreas  → seed JSON → management command → tabela Area → GET /api/carreira/areas/ → grade + modal → PDF (no cliente)
IA     → agente "carreira" (prompt + knowledge) → ChatIA (etapa 03) → gera JSON do plano → salva CareerPlan
Plano  → GET/POST/PATCH/DELETE /api/carreira/plano/ → checklist no Perfil
```

## Backend (`careers/`)

### Modelos (`careers/models.py`)
```python
class Area(models.Model):
    slug = SlugField(unique=True)
    nome = CharField(max_length=120)
    resumo = CharField(max_length=240)
    descricao = TextField(blank=True)
    formacao = TextField(blank=True)
    certificacoes = JSONField(default=list)   # ["CPA-20", "CFA", ...]
    hard_skills = JSONField(default=list)
    soft_skills = JSONField(default=list)
    cargos_entrada = JSONField(default=list)
    mulheres = JSONField(default=list)        # [{"nome","cargo","linkedin"}]
    ordem = PositiveIntegerField(default=0)
    atualizado_em = DateTimeField(auto_now=True)

class CareerPlan(models.Model):
    profile = OneToOne(Profile, related_name="plano_carreira")
    titulo = CharField(max_length=160, blank=True)
    passos = JSONField(default=list)  # [{"id","titulo","descricao","prazo","concluido"}]
    criado_em / atualizado_em
```
`Area` ordenada por `ordem, nome`. `CareerPlan` é 1 por usuária (OneToOne) — gerar um novo substitui. Admin: `AreaAdmin` (editável) e `CareerPlanAdmin` (leitura).

### Seed de áreas (`careers/data/areas.json` + command)
Arquivo JSON versionado com as áreas mínimas do requisito (descrição, formação, certificações, skills, cargos, mulheres com `linkedin` placeholder). Command `python manage.py seed_areas` faz **upsert** por `slug` (idempotente; não apaga planos). As mulheres de referência usam links placeholder (`https://www.linkedin.com/`), editáveis depois no Admin/seed.

### Agente de IA de carreira (etapa 03)
- `ai/prompts/carreira.md`: planejadora de carreira. Pergunta formação/experiência/tempo/área/objetivo; sugere trilha, certificações em ordem e cargos de entrada; quando a usuária pedir, oferece gerar o plano.
- `ai/knowledge/carreira/areas.md` e `certificacoes.md`: resumo das áreas e guia de certificações (CPA-20, CEA, CFP, CGA, CFA, FRM) — fonte para respostas coerentes com o guia.
- Nova entrada no registro `AGENTES` (`carreira`). Nenhuma mudança no motor de IA.

### Geração do plano pela IA
Endpoint `POST /api/carreira/plano/gerar/`: recebe `conversa_id` (opcional) ou um texto-base, chama o provedor **sem streaming** com um system que pede **JSON estrito** no formato `{"titulo": str, "passos": [{"titulo","descricao","prazo"}]}`. O backend valida/limpa o JSON (tolerante a cercas de código), atribui `id` e `concluido=false` a cada passo e devolve um rascunho (não salva ainda). Se o modelo não devolver JSON válido, retorna 422 com mensagem clara.

### Endpoints (`/api/carreira/`)
| Método | Rota | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/carreira/areas/` | autenticada | Lista de áreas (grade + modal). |
| GET | `/api/carreira/areas/<slug>/` | autenticada | Detalhe de uma área. |
| POST | `/api/carreira/plano/gerar/` | autenticada | Gera um rascunho de plano via IA (não salva). |
| GET | `/api/carreira/plano/` | autenticada (dono) | Plano salvo da usuária (ou 404). |
| PUT | `/api/carreira/plano/` | autenticada (dono) | Cria/substitui o plano (salva os passos). |
| PATCH | `/api/carreira/plano/passo/<id>/` | autenticada (dono) | Marca/desmarca um passo como concluído. |
| DELETE | `/api/carreira/plano/` | autenticada (dono) | Exclui o plano. |

Permissão de dono: o plano pertence ao `profile` autenticado.

## Frontend

### Tela Carreira (`app/(app)/carreira/page.tsx`)
Client component com duas seções e abas/alternância simples:
- **Áreas**: grade de `AreaCard` (nome + resumo). Tocar abre `AreaModal` (descrição, formação, certificações como chips, hard/soft skills, cargos de entrada, lista de mulheres com link LinkedIn, botão "Baixar PDF").
- **IA de carreira**: `<ChatIA agente="carreira" titulo="IA de carreira" />`, com um botão **"Gerar meu plano"** que chama `/plano/gerar/` e abre o `PlanoEditor` para revisar e salvar.

### PDF (`lib/pdfArea.ts`)
Geração **no cliente** com `jsPDF` (sem dependência de servidor serverless): cabeçalho com a marca (cores `azul-elas`/`rosa-elas`), nome da área, blocos de texto e listas. Nome do arquivo `por-elas-<slug>.pdf`. Erros capturados com aviso.

### Plano de carreira
- `PlanoEditor`: mostra o rascunho gerado (título + passos editáveis), botão **Salvar** (`PUT /plano/`).
- No **Perfil**, a seção "Minha jornada" passa a mostrar o plano salvo como **checklist** (marcar passo → `PATCH /plano/passo/<id>/`), com ações "Gerar novo" (leva à Carreira) e "Excluir".

### Componentes
`AreaCard`, `AreaModal`, `PlanoEditor`, `PlanoChecklist` (reutilizável no Perfil), `ChipsLista`.

## Dependências novas
- Backend: nenhuma nova (usa a camada de IA existente; JSONField nativo).
- Frontend: `jspdf` para o PDF no cliente.

## Estratégia de verificação
- Testes backend: `seed_areas` idempotente (upsert por slug); listagem/detalhe de áreas; geração de plano com provedor **mockado** devolvendo JSON (e caso de JSON inválido → 422); dono-only no plano; marcar passo.
- Teste manual com `GEMINI_API_KEY`: conversar com a IA de carreira, gerar plano, salvar, ver checklist no Perfil, baixar PDF de uma área.
- `check`, `migrate`, `seed_areas`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Mentoria humana e agenda (etapa 05). O chat só pode sugerir buscar mentoria.
- Conteúdo real/curado das mulheres de referência (placeholders editáveis).
- RAG/embeddings (continua injeção direta de conhecimento).
