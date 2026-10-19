# Tarefas — 02-aulas

- [ ] 1. Modelo e armazenamento R2
- [ ] 1.1 Criar o modelo `Lesson` + migração + admin
  - Campos do design; índices; `LessonAdmin` (filtros, busca, URLs editáveis para "Básico com IA").
  - _Requisitos: 1.3, 3.4, 5.4, 7.1, 7.3_
- [ ] 1.2 Cliente R2 (`lessons/storage.py`) + settings/env
  - `boto3` S3 para R2; `presign_put`, `url_publica`, `deletar`; validação de tipo/tamanho; chave com prefixo+uuid.
  - `R2_*` e limites de upload nas settings e `.env.example`.
  - _Requisitos: 4.1, 4.2, 4.6, 8.2, 8.3, 8.4_

- [ ] 2. Endpoints de aulas
- [ ] 2.1 Listagem, detalhe, empresas e busca
  - `GET /api/aulas/` (filtros empresa/origem/q, paginação), `GET /api/aulas/<id>/`, `GET /api/aulas/empresas/`.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 6.2, 6.3_
- [ ] 2.2 Gerar URL pré-assinada
  - `POST /api/aulas/upload-url/` (permissão empresa aprovada; valida tipo/tamanho; TTL curto).
  - _Requisitos: 3.2, 4.1, 4.2, 4.6, 8.1, 8.2, 8.4_
- [ ] 2.3 Criar, editar, excluir aula
  - `POST /api/aulas/` (empresa aprovada; associa à Company), `PATCH`/`DELETE /api/aulas/<id>/` (dono; delete remove do R2).
  - _Requisitos: 3.1, 3.3, 3.4, 5.1, 5.2, 5.3_
- [ ] 2.4 Testes do backend
  - Permissão, validação de tipo/tamanho, filtros/busca, dono para editar/excluir.
  - _Requisitos: 2.2, 3.2, 4.2, 5.3, 8.1_

- [ ] 3. Frontend — listagem e navegação
- [ ] 3.1 Tela Aulas (chips, busca, seções, cards)
  - `ChipsEmpresas`, busca com debounce, seção "Básico com IA" e por empresa, `LessonCard`.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3_
- [ ] 3.2 Player
  - `/aulas/[id]` com `<video controls>`, metadados e (para dono) ações editar/excluir.
  - _Requisitos: 6.1, 6.2, 6.3, 5.1, 5.2_

- [ ] 4. Frontend — upload
- [ ] 4.1 Modal de upload com validação e progresso
  - Campos; validar duração (via `<video>`), tipo e tamanho no cliente; presign → PUT com progresso (XHR); confirmar criação.
  - Botão "Adicionar conteúdo" só para empresa aprovada.
  - _Requisitos: 3.1, 3.3, 4.3, 4.4, 4.5, 4.7_
- [ ] 4.2 Upload da thumbnail (opcional)
  - Mesmo fluxo de presign para imagem; fallback placeholder/quadro do vídeo.
  - _Requisitos: 3.5, 4.6_

- [ ] 5. Verificação e documentação
- [ ] 5.1 Verificar tudo
  - `check`, `migrate`, testes, `npm run build`/`lint`; teste manual de upload/player/edição/exclusão com R2 real.
  - _Requisitos: 4.1, 6.1 (validação geral)_
- [ ] 5.2 README: configuração do R2
  - Bucket, token S3, endpoint, domínio público, CORS, variáveis.
  - _Requisitos: 8.3_

- [ ] 6. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
