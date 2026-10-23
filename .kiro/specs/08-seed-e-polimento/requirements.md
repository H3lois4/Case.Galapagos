# Requisitos — 08-seed-e-polimento

## Introdução

Última etapa: um comando **`seed_demo`** que popula o banco com dados de demonstração coerentes (empresas aprovadas, aulas, áreas de carreira, questões, posts, notícias, horários de mentoria) para a banca testar o app ponta a ponta, e uma **revisão final** que garante que tudo roda junto (build, testes, lint) e que o README reflete o estado final.

Depende de todas as etapas anteriores (00–07).

## Requisitos

### Requisito 1 — Comando de seed de demonstração

**User Story:** Como equipe do app, quero um comando que popule dados realistas, para demonstrar todas as telas sem cadastrar tudo à mão.

#### Acceptance Criteria
1. DEVE existir `python manage.py seed_demo` que cria dados de demonstração para as telas: Aulas, Carreira, Mentoria, Prática, Rede e Perfis.
2. O comando DEVE ser **idempotente**: rodar de novo não duplica os dados (upsert por chaves estáveis).
3. O comando DEVE criar: ao menos **2 empresas aprovadas**, alguns **perfis** de exemplo (pessoal e de empresa), **aulas** (empresa e "Básico com IA"), **áreas de carreira** (reusando `seed_areas`), **questões** (reusando `seed_questions`), **posts/vagas/notícias** na Rede e **horários de mentoria** futuros.
4. O comando NÃO DEVE exigir serviços externos (R2, Gemini, Google): usa URLs/placeholder e conteúdo fixo, funcionando offline.
5. O comando DEVE poder **limpar** os dados de demo que ele criou (flag `--limpar`), sem afetar dados reais de usuárias.
6. O seed NÃO DEVE criar/identidade de login real no Supabase; os perfis de demo existem só no Django (para preencher telas), ligados a `supabase_sub` fictícios marcados como demo.

### Requisito 2 — Conteúdo coerente e com a identidade do produto

#### Acceptance Criteria
1. Os dados DEVEM estar em **português** e no tom do produto (acolhedor), coerentes com o mercado financeiro.
2. As aulas de demonstração DEVEM ter título, descrição e uma `video_url` placeholder utilizável (ex.: um MP4 público de teste), para o player abrir.
3. As notícias de demo DEVEM ter título, categoria e resumo (sem depender da IA).
4. Os horários de mentoria DEVEM estar **no futuro** para poderem ser agendados.

### Requisito 3 — Revisão final e documentação

#### Acceptance Criteria
1. `check`, `migrate`, a suíte de testes, `npm run build` e `lint` DEVEM passar.
2. O README DEVE documentar o uso do `seed_demo` (e `--limpar`) e refletir que todas as etapas (00–08) estão concluídas.
3. O roadmap no README DEVE marcar `08-seed-e-polimento` como concluída.

### Requisito 4 — Segurança

#### Acceptance Criteria
1. O seed NÃO DEVE inserir segredos nem credenciais reais.
2. Os perfis de demo DEVEM ser distinguíveis dos reais (prefixo/flag) para o `--limpar` removê-los com segurança.
