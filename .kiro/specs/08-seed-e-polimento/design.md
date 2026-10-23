# Design — 08-seed-e-polimento

## Visão geral

Um comando `seed_demo` no app `seed` que cria dados de demonstração idempotentes
em todos os domínios, reusando os seeds já existentes (`seed_areas`,
`seed_questions`) e criando o resto com chaves estáveis. Tudo offline (sem R2,
Gemini ou Google). Uma flag `--limpar` remove só o que o seed criou.

## Marcadores de demo

- **Perfis de demo:** `supabase_sub` com prefixo `demo-` (ex.: `demo-ana`,
  `demo-galapagos`). Isso distingue dos reais e permite `--limpar` seguro.
- **Empresas de demo:** `slug` estável (`demo-galapagos`, `demo-azul-capital`).
- **Conteúdo (aulas/posts/mentoria):** ligados a esses perfis/empresas de demo;
  o `--limpar` apaga por esses vínculos (cascade dos perfis/empresas de demo).

## Command `seed/management/commands/seed_demo.py`

```
python manage.py seed_demo            # cria/atualiza (idempotente)
python manage.py seed_demo --limpar   # remove os dados de demo
```

Passos do `handle` (cada um idempotente, `update_or_create`/`get_or_create`):
1. **Áreas e questões:** chama `call_command("seed_areas")` e `seed_questions`.
2. **Empresas:** 2 `Company` aprovadas (`demo-galapagos`, `demo-azul-capital`)
   com logo placeholder.
3. **Perfis:** algumas `Profile` pessoais (`demo-ana`, `demo-bia`) e de empresa
   (`demo-galapagos-rh` ligada à empresa), com username/nome/descrição.
4. **Aulas:** 2–3 `Lesson` por empresa + 2 "Básico com IA" (origem=ia), com
   `video_url` de um MP4 público de teste e thumb opcional.
5. **Carreira:** opcionalmente um `CareerPlan` de exemplo para `demo-ana`.
6. **Mentoria:** alguns `MentorshipSlot` futuros das empresas (datas +7/+14 dias).
7. **Rede:** `Post` comum (das pessoas), `vaga` e `noticia` (empresas), e
   algumas `noticia` com `origem_ia=True` (sem depender do LLM — texto fixo).
8. Resumo no stdout (quantos de cada).

`--limpar`: apaga perfis/empresas com os `supabase_sub`/`slug` de demo (cascata
remove aulas, posts, mentorias, planos) e as notícias de IA marcadas como demo.
NÃO roda `seed_areas`/`seed_questions` reverso (esses são conteúdo base, não
"demo"); documentar.

### Idempotência
- `Company`: `update_or_create(slug=...)`.
- `Profile`: `update_or_create(supabase_sub=...)`.
- `Lesson`/`Post`/`MentorshipSlot`: usar uma `chave` lógica — como esses modelos
  não têm campo único próprio, o seed busca por um conjunto estável
  (ex.: `titulo`+empresa para aula; `titulo`+origem_ia para notícia) com
  `get_or_create`, evitando duplicar em re-execuções.

## Dados (constantes no módulo)
Blocos de dicionários em português: empresas, perfis, aulas (com `video_url`
placeholder — usar um MP4 de teste público estável), notícias, vagas, slots.
URLs de vídeo/imagem são placeholders públicos (não dependem do R2).

## Revisão final
- Rodar: `check`, `migrate`, `seed_demo`, `python manage.py test` (todos os apps),
  `npm run build` e `lint`.
- Atualizar README: seção "Seed de demonstração" com uso real e roadmap ✅ (08).

## Estratégia de verificação
- Teste backend: `seed_demo` cria dados e é **idempotente** (rodar 2x mantém as
  contagens); `--limpar` remove os perfis/empresas de demo (e o conteúdo em
  cascata) sem derrubar dados não-demo.
- `check`, `migrate`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Popular interações sociais em massa (curtidas/comentários) além de exemplos.
- Qualquer dado que exija serviços externos reais.
