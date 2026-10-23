# Tarefas — 08-seed-e-polimento

- [x] 1. Comando `seed_demo`
- [x] 1.1 Empresas, perfis e marcadores de demo
  - `Company` aprovadas (slug demo-*), `Profile` demo (supabase_sub demo-*), idempotente.
  - _Requisitos: 1.2, 1.3, 1.6, 4.2_
- [x] 1.2 Conteúdo: aulas, carreira, mentoria, rede
  - Reusa `seed_areas`/`seed_questions`; cria `Lesson` (empresa + IA), `MentorshipSlot` futuros, `Post`/`vaga`/`noticia` (inclui notícia origem_ia com texto fixo); `CareerPlan` de exemplo.
  - _Requisitos: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_
- [x] 1.3 Flag `--limpar`
  - Remove perfis/empresas de demo (cascata) sem afetar dados reais.
  - _Requisitos: 1.5, 4.2_

- [x] 2. Testes
- [x] 2.1 Testes do `seed_demo`
  - Cria dados; idempotente (2x mantém contagens); `--limpar` remove demo e preserva não-demo. (3 testes)
  - _Requisitos: 1.2, 1.5_

- [x] 3. Revisão final e documentação
- [x] 3.1 Verificar tudo
  - `check`, `migrate`, `seed_demo`, testes (99 ok), `npm run build`/`lint` verdes.
  - _Requisitos: 3.1_
- [x] 3.2 README: seed_demo + roadmap final
  - Uso de `seed_demo`/`--limpar`; roadmap 08 ✅; status geral.
  - _Requisitos: 3.2, 3.3_

- [ ] 4. Commit e push na main
  - Conventional Commits PT; push após o commit.
