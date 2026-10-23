# Tarefas — 04-carreira

- [x] 1. Áreas do mercado (dados e API)
- [x] 1.1 Modelos `Area` e `CareerPlan` + admin + migração
  - Campos do design; `AreaAdmin` editável; `CareerPlanAdmin` leitura.
  - _Requisitos: 1.1, 1.4, 5.2_
- [x] 1.2 Seed de áreas (`careers/data/areas.json` + `seed_areas`)
  - Upsert idempotente por slug; áreas mínimas do requisito, com certificações, skills, cargos e mulheres (LinkedIn placeholder).
  - _Requisitos: 1.2, 1.4, 2.2, 2.3, 6.2_
- [x] 1.3 Endpoints de áreas
  - `GET /api/carreira/areas/` e `GET /api/carreira/areas/<slug>/`.
  - _Requisitos: 1.1, 1.3, 2.1_

- [x] 2. IA de carreira e plano
- [x] 2.1 Agente de carreira (prompt + conhecimento)
  - `ai/prompts/carreira.md`; `ai/knowledge/carreira/areas.md` e `certificacoes.md`; entrada no registro `AGENTES`.
  - _Requisitos: 4.2, 4.3, 4.4_
- [x] 2.2 Geração e persistência do plano
  - `POST /api/carreira/plano/gerar/` (IA → JSON estrito, 422 se inválido); `GET/PUT/DELETE /api/carreira/plano/`; `PATCH /api/carreira/plano/passo/<id>/`.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_
- [x] 2.3 Testes do backend
  - `seed_areas` idempotente; áreas; geração de plano (mock JSON ok e inválido→422); dono-only; marcar passo. (11 testes)
  - _Requisitos: 1.4, 5.1, 5.3, 5.5_

- [x] 3. Frontend — áreas, PDF e chat
- [x] 3.1 Grade + modal de área
  - `AreaCard`, `AreaModal` (descrição, formação, certificações, skills, cargos, mulheres com LinkedIn).
  - _Requisitos: 1.1, 1.3, 2.1, 2.2, 2.4_
- [x] 3.2 Baixar PDF (`lib/pdfArea.ts`, jsPDF)
  - PDF com identidade visual; nome `por-elas-<slug>.pdf`; aviso em erro.
  - _Requisitos: 3.1, 3.2, 3.3_
- [x] 3.3 Chat da IA de carreira + gerar plano
  - `<ChatIA agente="carreira" />`; botão "Gerar meu plano" → `PlanoEditor` (revisar e salvar).
  - _Requisitos: 4.1, 5.1, 5.2_

- [x] 4. Frontend — plano no Perfil
- [x] 4.1 Checklist do plano no Perfil
  - `PlanoChecklist`: marcar passo (`PATCH`), "Gerar novo" (→ Carreira), "Excluir".
  - _Requisitos: 5.3, 5.4_

- [x] 5. Verificação e documentação
- [x] 5.1 Verificar tudo
  - `check`, `migrate`, `seed_areas`, testes (56 ok), `npm run build`/`lint` verdes.
  - Teste manual (áreas, PDF ok; chat/plano dependem da `GEMINI_API_KEY`): pendente da chave.
  - _Requisitos: 1.1, 4.1 (validação geral)_
- [x] 5.2 README: seção de carreira
  - Como rodar `seed_areas`, onde editar as áreas e o agente de carreira.
  - _Requisitos: 1.4_

- [ ] 6. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
