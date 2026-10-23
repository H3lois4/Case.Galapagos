# Tarefas — 06-pratica

- [x] 1. Simulados — dados e correção
- [x] 1.1 Modelos `Question`/`QuizAttempt`/`Interview` + admin + migração
  - Campos do design; `QuestionAdmin` editável; attempts/interviews leitura.
  - _Requisitos: 1.3, 3.3, 5.3_
- [x] 1.2 Temas + seed de questões (`data/questions.json` + `seed_questions`)
  - 6 temas; upsert idempotente por `chave`; **ao menos 1 questão por tema** funcional (13 no total).
  - _Requisitos: 1.1, 1.2, 1.3, 1.4_
- [x] 1.3 Serviço de simulado (`services_quiz.py`)
  - `iniciar` (≤10 aleatórias, payload sem gabarito); `corrigir` (no server, nota + revisão, não recorrige).
  - _Requisitos: 2.1, 2.2, 3.1, 3.2_

- [x] 2. Entrevista com IA
- [x] 2.1 Agente entrevistadora (prompt + conhecimento) + registro
  - `ai/prompts/entrevistadora.md`; `ai/knowledge/entrevistadora/tipos.md`; entrada em `AGENTES`.
  - _Requisitos: 4.2, 4.4_
- [x] 2.2 Serviço de entrevista (`services_interview.py`)
  - `iniciar_entrevista` (Conversation + Interview, injeta contexto); `gerar_relatorio` (IA → JSON schema fixo, 422 inválido).
  - _Requisitos: 4.1, 5.1, 5.4_

- [x] 3. Endpoints + testes backend
- [x] 3.1 Endpoints `/api/pratica/*`
  - temas; simulados iniciar/responder/historico; entrevistas criar/detalhe/relatorio/historico; permissões dono.
  - _Requisitos: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 7.2_
- [x] 3.2 Testes do backend
  - seed idempotente; temas+contagem; iniciar sem gabarito; correção nota; não recorrige; dono-only; relatório mock (ok e inválido→422). (12 testes)
  - _Requisitos: 1.4, 2.2, 3.1, 3.2, 5.4, 7.2, 7.4_

- [x] 4. Frontend — simulados
- [x] 4.1 Tela Prática (abas) + grade de temas
  - `TemaCard` com contagem; abas Simulados/Entrevista.
  - _Requisitos: 1.1, 1.2_
- [x] 4.2 Fazer simulado + resultado
  - `Simulado` (cronômetro opcional, responder, finalizar); `ResultadoSimulado` (nota + explicações).
  - _Requisitos: 2.3, 2.4, 2.5, 3.2_

- [x] 5. Frontend — entrevista
- [x] 5.1 Setup + chat da entrevista
  - `EntrevistaSetup`; reuso de `ChatIA` com `conversaIdInicial` e idioma de voz (kickoff da 1ª pergunta).
  - _Requisitos: 4.1, 4.3_
- [x] 5.2 Relatório + PDF
  - `RelatorioEntrevista` (render do schema) + `lib/pdfRelatorio.ts`.
  - _Requisitos: 5.1, 5.2_

- [x] 6. Frontend — histórico no Perfil
- [x] 6.1 Histórico de simulados e entrevistas
  - Resumo compacto em "Minha jornada".
  - _Requisitos: 6.1, 6.2_

- [x] 7. Verificação e documentação
- [x] 7.1 Verificar tudo
  - `check`, `migrate`, `seed_questions`, testes (80 ok), `npm run build`/`lint` verdes.
  - Teste manual: simulado ponta a ponta ok; entrevista + relatório dependem da `GEMINI_API_KEY`.
  - _Requisitos: 2.1, 5.1 (validação geral)_
- [x] 7.2 README: seção de prática
  - Como rodar `seed_questions`, editar questões, agente entrevistadora.
  - _Requisitos: 1.3_

- [ ] 8. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
