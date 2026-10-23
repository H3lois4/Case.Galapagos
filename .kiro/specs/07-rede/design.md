# Design — 07-rede

## Visão geral

Feed social com três tipos de post (`post`, `vaga`, `noticia`), interações
(curtir/comentar/seguir/compartilhar), carrossel de notícias e um job de IA que
publica notícias diárias a partir de feeds RSS. Reusa `Follow`, o upload R2 e a
camada de IA.

```
Criar post → (imagem opcional) presign R2 (etapa 02) → POST /api/rede/posts/
Feed → GET /api/rede/posts/?filtro=todos|seguindo|vagas (paginado)
Interações → curtir (toggle), comentar, excluir (dono)
Notícias → carrossel lê posts tipo=noticia; página pública /post/[id] com OG
IA notícias → Vercel Cron → POST /api/ai/news/run/ (CRON_SECRET)
             → lê RSS → LLM reescreve → cria posts noticia (autor "Por ELAS")
```

## Backend (`network/`)

### Modelos (`network/models.py`)
```python
class Post(models.Model):
    TIPO = [("post","Post"),("vaga","Vaga"),("noticia","Notícia")]
    autor = FK(Profile, null=True, on_delete=SET_NULL, related_name="posts")   # usuária
    company = FK(Company, null=True, on_delete=CASCADE, related_name="posts")  # em nome da empresa
    origem_ia = BooleanField(default=False)   # notícia da conta oficial "Por ELAS"
    tipo = CharField(max_length=10, default="post")
    texto = TextField(blank=True)             # até 2000 (validado no serializer)
    imagem_url = URLField(blank=True)
    imagem_key = CharField(max_length=512, blank=True)
    # vaga
    vaga_cargo = CharField(max_length=160, blank=True)
    vaga_local = CharField(max_length=160, blank=True)   # local/modelo
    vaga_link = URLField(blank=True)
    # noticia
    titulo = CharField(max_length=200, blank=True)
    categoria = CharField(max_length=40, blank=True)      # juros, bolsa, cambio, cripto, carreira
    fonte_url = URLField(blank=True)
    fonte_chave = CharField(max_length=300, blank=True, db_index=True)  # dedupe
    curtidas_count = PositiveIntegerField(default=0)      # desnormalizado
    comentarios_count = PositiveIntegerField(default=0)
    criado_em (db_index)

class PostLike(models.Model):
    post = FK(Post, related_name="curtidas")
    profile = FK(Profile, related_name="curtidas")
    class Meta: UniqueConstraint(post, profile)

class Comment(models.Model):
    post = FK(Post, related_name="comentarios")
    autor = FK(Profile, related_name="comentarios")
    texto = TextField()
    criado_em
```
- Autoria: posts de usuária têm `autor`; posts "em nome da empresa" têm `company` (e geralmente `autor` = quem publicou). Notícia da IA: `origem_ia=True`, sem autor/empresa.
- `curtidas_count`/`comentarios_count` desnormalizados, atualizados em transação ao curtir/comentar (simples e barato para o feed).
- `fonte_chave` = hash do link/título normalizado, para o job de notícias não duplicar.
- Admin: `PostAdmin` (filtra por tipo/origem_ia, remove), `CommentAdmin`.

### Autor serializado
`autor_dict`: `{tipo: "usuaria"|"empresa"|"ia", nome, username?, slug?, foto/logo}`. A IA Por ELAS vira `{tipo:"ia", nome:"Por ELAS"}` com selo. Isso dá o selo visual do requisito 1.4/1.2.

### Endpoints (`/api/rede/`)
| Método | Rota | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/rede/posts/` | autenticada | Feed paginado; `?filtro=todos\|seguindo\|vagas`. |
| POST | `/api/rede/posts/` | autenticada (vaga/noticia → empresa aprovada) | Cria post. |
| GET | `/api/rede/posts/<id>/` | **pública** | Detalhe do post (para `/post/[id]` e OG). |
| DELETE | `/api/rede/posts/<id>/` | autora/empresa dona | Exclui (remove imagem do R2). |
| POST | `/api/rede/posts/<id>/curtir/` | autenticada | Toggle curtida; devolve estado + contador. |
| GET | `/api/rede/posts/<id>/comentarios/` | autenticada | Lista comentários. |
| POST | `/api/rede/posts/<id>/comentarios/` | autenticada | Comenta. |
| DELETE | `/api/rede/comentarios/<id>/` | autora do comentário ou dona do post | Exclui comentário. |
| GET | `/api/rede/noticias/` | autenticada | Últimas notícias (carrossel). |
| POST | `/api/ai/news/run/` | **CRON_SECRET** | Job da IA de notícias. |

A rota de detalhe do post é **pública** (sem auth) para o Open Graph funcionar; só expõe conteúdo público. Reusa `presign` de `lessons.storage` para a imagem (tipo imagem, 5 MB).

### IA de notícias (`network/news.py` + endpoint em `ai`)
- Lê feeds RSS de uma **lista configurável** (`NEWS_FEEDS` em env/settings; padrão com alguns feeds de economia/mercado). Parsing simples do XML (sem dependência pesada: `xml.etree`), pegando `item` (título, link, descrição).
- **Dedupe** por `fonte_chave` (hash do link). Processa **até N itens novos** por execução (`NEWS_MAX_POR_RUN`, padrão 3).
- Para cada item: chama o LLM (etapa 03, sem streaming) com um system que pede **JSON** `{titulo, categoria, resumo}` reescrito com palavras próprias (≤120 palavras), **sem copiar**. Cria `Post(tipo="noticia", origem_ia=True, fonte_url, fonte_chave, categoria, titulo, texto=resumo)`.
- Categoria mapeia para uma **ilustração própria** por cor (sem buscar imagem externa): o frontend desenha um card com gradiente por categoria quando não há `imagem_url` (evita problemas de direitos de imagem).
- Proteção: `POST /api/ai/news/run/` exige header/ച`?secret=` igual a `CRON_SECRET` (comparação segura); sem `CRON_SECRET` configurado, responde 503. Sem `GEMINI_API_KEY`, idem (503) — degrada.
- **Rodar manual:** command `python manage.py run_news` e/ou botão no admin (action) — para a demo.

### Settings/env novos
`CRON_SECRET` (já existe), `NEWS_FEEDS` (csv de URLs), `NEWS_MAX_POR_RUN=3`. `vercel.json` do backend ganha a cron diária (documentar; não quebrar local).

## Frontend (`app/(app)/rede/` e `app/post/[id]`)

### Tela Rede
- **Carrossel** (`CarrosselNoticias`): auto-avança a cada 6 s, pausa no hover/touch, indicadores, swipe; respeita `prefers-reduced-motion`. Cada slide → `/post/[id]`.
- **Filtros** (chips): Todos / Quem eu sigo / Vagas.
- **Compositor** (`NovoPost`): texto + imagem (presign R2, progresso simples); empresa aprovada vê abas para `post`/`vaga`/`noticia` com campos extras.
- **Feed**: `PostCard` (autor + selo, texto, imagem, vaga/notícia com layout próprio, curtir, comentar, compartilhar, excluir se dono). `Comentarios` expansível.

### Página pública do post (`app/post/[id]/page.tsx`)
Fora do grupo `(app)` (sem exigir login). **Server component** que busca o post pela API e gera `generateMetadata` (Open Graph: título, descrição, imagem). Renderiza o post e um link para abrir o app. Compartilhamento com Web Share API no cliente (`BotaoCompartilhar`).

### Perfil público `/u/[username]`
Passa a listar os **posts da pessoa/empresa** (novo endpoint ou filtro no feed por autor). Substitui o texto placeholder atual.

### Componentes
`CarrosselNoticias`, `PostCard`, `NovoPost`, `Comentarios`, `BotaoCompartilhar`, `SeloAutor`, `CardNoticiaFallback` (gradiente por categoria).

## Dependências
- Backend: nenhuma nova (RSS via `xml.etree` da stdlib; LLM e R2 já existem).
- Frontend: nenhuma nova.

## Estratégia de verificação
- Testes backend: criar `post` (qualquer), `vaga`/`noticia` só empresa aprovada (403 p/ pessoal); feed e filtros (todos/seguindo/vagas); curtir toggle + contador; comentar + excluir (dono e dona do post); detalhe público sem auth; dedupe de notícias; `news/run` protegido por `CRON_SECRET` (401/403 sem segredo; cria posts com LLM e RSS **mockados**).
- Teste manual: postar com imagem (R2), curtir/comentar/seguir, filtros, compartilhar, carrossel; rodar `run_news` com `GEMINI_API_KEY`.
- `check`, `migrate`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Edição de post (só criar/excluir). Notificações. Denúncia é só um placeholder de UI → marca para o admin (sem fluxo completo).
- Busca no feed, hashtags, feed algorítmico (ordem é cronológica).
