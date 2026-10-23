# Tarefas — 07-rede

- [x] 1. Modelos e API do feed
- [x] 1.1 Modelos `Post`/`PostLike`/`Comment` + admin + migração
  - Campos do design (tipos post/vaga/noticia, origem_ia, vaga_*, noticia_*, contadores desnormalizados, fonte_chave dedupe); admin.
  - _Requisitos: 1.2, 2.1, 2.3, 7.4_
- [x] 1.2 Serializers + autor serializado (selo)
  - `autor_dict` (usuaria/empresa/ia); PostSerializer, CommentSerializer, criação.
  - _Requisitos: 1.2, 1.4_
- [x] 1.3 Endpoints de posts (feed, criar, detalhe público, excluir)
  - `GET/POST /api/rede/posts/` (filtros todos/seguindo/vagas; vaga/noticia só empresa aprovada), `GET /api/rede/posts/<id>/` público, `DELETE` dono (remove imagem R2).
  - _Requisitos: 1.1, 1.3, 2.1, 2.3, 2.4, 2.5, 4.1, 5.3, 8.1, 8.2_

- [x] 2. Interações
- [x] 2.1 Curtir, comentar, excluir comentário
  - `POST /curtir/` toggle; `GET/POST /comentarios/`; `DELETE /comentarios/<id>/` (dono do comentário ou do post); contadores em transação.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_
- [x] 2.2 Posts por autor (perfil público) + notícias (carrossel)
  - Filtro `?autor=`/`?empresa=`; `GET /api/rede/noticias/`.
  - _Requisitos: 4.1, 6.1_

- [x] 3. IA de notícias
- [x] 3.1 Leitor de RSS + reescrita por IA (`network/news.py`)
  - Parse RSS (xml.etree), dedupe por fonte_chave, LLM → JSON {titulo, categoria, resumo} reescrito, cria posts noticia (origem_ia).
  - _Requisitos: 7.2, 7.3, 7.4, 7.6, 7.7_
- [x] 3.2 Endpoint protegido + rodar manual
  - `POST /api/ai/news/run/` com `CRON_SECRET`; command `run_news`; action no admin; settings `NEWS_FEEDS`/`NEWS_MAX_POR_RUN`; `.env.example`.
  - _Requisitos: 7.1, 7.5, 7.6, 8.3_

- [x] 4. Testes backend
- [x] 4.1 Testes
  - criar post/vaga/noticia (permissão), feed+filtros, curtir toggle, comentar/excluir, detalhe público, dedupe notícias, news/run protegido (RSS+LLM mockados). (16 testes)
  - _Requisitos: 2.4, 3.1, 3.3, 4.1, 5.3, 7.1, 7.6_

- [x] 5. Frontend — feed e interações
- [x] 5.1 Tela Rede (carrossel + filtros + compositor + feed)
  - `CarrosselNoticias`, chips de filtro, `NovoPost` (texto + imagem R2; abas vaga/noticia p/ empresa), `PostCard`, `SeloAutor`.
  - _Requisitos: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 6.1, 6.2, 6.4_
- [x] 5.2 Curtir, comentar, compartilhar, excluir
  - Toggle curtir; `Comentarios` expansível; `BotaoCompartilhar` (Web Share + copiar link); excluir dono.
  - _Requisitos: 3.1, 3.2, 3.3, 5.2_

- [x] 6. Frontend — página pública e perfil
- [x] 6.1 Página pública `/post/[id]` com Open Graph
  - Server component + `generateMetadata`; render do post; leitura sem login.
  - _Requisitos: 5.1, 5.3_
- [x] 6.2 Posts no perfil público `/u/[username]`
  - Lista os posts da pessoa/empresa.
  - _Requisitos: 4.1_

- [x] 7. Verificação e documentação
- [x] 7.1 Verificar tudo
  - `check`, `migrate`, testes (96 ok), `npm run build`/`lint` verdes.
  - Teste manual (postar/curtir/comentar/compartilhar/carrossel; `run_news`): imagem depende do R2; `run_news` depende da `GEMINI_API_KEY`.
  - _Requisitos: 1.1, 7.1 (validação geral)_
- [x] 7.2 README: seção de rede + IA de notícias (cron)
  - `NEWS_FEEDS`, `CRON_SECRET`, cron na Vercel, rodar manual.
  - _Requisitos: 7.1, 7.5_

- [ ] 8. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
