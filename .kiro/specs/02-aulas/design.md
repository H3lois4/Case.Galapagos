# Design — 02-aulas

## Visão geral

A tela Aulas lista vídeos por empresa e na seção "Básico com IA". O upload vai **direto do navegador para o Cloudflare R2** via **URL pré-assinada (presigned POST/PUT)** gerada pelo Django com `boto3` (R2 é compatível com S3). O backend valida tipo e tamanho na política; o frontend valida duração e tipo antes de enviar e mostra barra de progresso.

```
Empresa → (1) pede presigned ao Django → (2) Django valida e assina (boto3/R2)
        → (3) navegador faz PUT do vídeo direto no R2 (progress)
        → (4) navegador confirma ao Django a criação da Lesson com a chave do objeto
Usuária → GET /api/aulas/ → player lê o vídeo da URL pública do R2
```

## Backend (`lessons/`)

### Modelo

```python
class Lesson(models.Model):
    ORIGEM_EMPRESA = "empresa"
    ORIGEM_IA = "ia"            # Básico com IA (conta oficial Por ELAS)

    company = models.ForeignKey("accounts.Company", null=True, blank=True,
                                on_delete=models.CASCADE, related_name="aulas")
    origem = models.CharField(max_length=10, default=ORIGEM_EMPRESA)  # empresa|ia
    autor = models.ForeignKey("accounts.Profile", null=True, blank=True,
                              on_delete=models.SET_NULL, related_name="aulas")
    titulo = models.CharField(max_length=160)
    descricao = models.TextField(blank=True)
    video_key = models.CharField(max_length=512)     # chave do objeto no R2
    video_url = models.URLField()                    # URL pública de leitura
    thumb_url = models.URLField(blank=True)
    duracao_seg = models.PositiveIntegerField(default=0)
    tamanho_bytes = models.BigIntegerField(default=0)
    publicado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
```

Índices por `company` e `origem`; ordenação por `-publicado_em`. `__str__` = título.

### Armazenamento R2 (`lessons/storage.py`)

Cliente `boto3` S3 apontando para o endpoint R2 (`https://<accountid>.r2.cloudflarestorage.com`), credenciais de env. Funções:
- `presign_put(key, content_type, max_bytes, expira=600)` → URL + headers para PUT direto.
- `url_publica(key)` → URL pública (domínio público do bucket `R2_PUBLIC_BASE_URL`).
- `deletar(key)` → remove objeto (ao excluir aula).

Validação de `content_type` (lista permitida) e `max_bytes` por tipo (vídeo 200 MB, imagem 5 MB). Chave gerada com prefixo por empresa e uuid: `aulas/<company_slug|ia>/<uuid>.<ext>`.

### Endpoints (`/api/`)

| Método | Rota | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/aulas/` | autenticada | Lista paginada; filtros `?empresa=<slug>`, `?origem=ia`, `?q=<busca>`. |
| GET | `/api/aulas/<id>/` | autenticada | Detalhe de uma aula (player). |
| GET | `/api/aulas/empresas/` | autenticada | Empresas que têm aulas (para os chips, com logo). |
| POST | `/api/aulas/upload-url/` | empresa aprovada | Gera presigned (body: `tipo`, `content_type`, `tamanho`); valida. |
| POST | `/api/aulas/` | empresa aprovada | Cria a aula após o upload (body: título, descrição, `video_key`, `thumb_key?`, `duracao_seg`, `tamanho_bytes`). |
| PATCH | `/api/aulas/<id>/` | dono (mesma empresa) | Edita título/descrição/thumb. |
| DELETE | `/api/aulas/<id>/` | dono (mesma empresa) | Exclui a aula (e objeto no R2). |

Permissão `EmpresaAprovada`: `request.user.profile.empresa_aprovada`. Permissão de dono: a aula pertence à `company` do perfil. Admin ignora essas restrições.

### Admin
`LessonAdmin`: lista título, empresa, origem, data; filtro por origem/empresa; busca por título. Campos de URL (`video_url`, `thumb_url`) editáveis para permitir cadastrar "Básico com IA" e o seed apontando para objetos do R2.

### Settings / env novos
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (derivado do account id), `R2_PUBLIC_BASE_URL`. Limites: `UPLOAD_VIDEO_MAX_BYTES=209715200` (200 MB), `UPLOAD_IMG_MAX_BYTES=5242880` (5 MB), `UPLOAD_URL_TTL=600`.

## Frontend (`app/(app)/aulas/`)

### Tela Aulas
- **Chips** horizontais (Todas, IA Por ELAS, cada empresa com logo) → filtram via query.
- **Busca** por título (input com debounce).
- **Seções**: "Básico com IA" (carrossel) e uma por empresa (carrossel), usando `LessonCard` (thumb, título, empresa/Por ELAS).
- Botão **"Adicionar conteúdo"** visível só para empresa aprovada (lê `me`).

### Upload (modal `UploadAulaModal`)
1. Campos: título, descrição, thumbnail (file, opcional), vídeo (file).
2. Ao escolher o vídeo: ler `duration` via `<video>` oculto; validar tipo (`mp4`/`webm`), tamanho (≤200 MB) e duração (≤10 min). Erros claros, sem subir.
3. `POST /api/aulas/upload-url/` → recebe presigned; faz `PUT` com `XMLHttpRequest` para ter **progresso** (fetch não dá progress de upload).
4. (Opcional) mesmo fluxo para a thumbnail.
5. `POST /api/aulas/` confirmando a criação; fecha o modal e atualiza a lista.

### Player (`/aulas/[id]`)
`<video controls>` com a `video_url` do R2, título, descrição, autor (empresa/Por ELAS) e data. Empresa dona vê ações de editar/excluir.

### Componentes
`LessonCard`, `ChipsEmpresas`, `UploadAulaModal`, `BarraProgresso`, `PlayerAula`.

## Estratégia de verificação
- Testes backend: permissão (só empresa aprovada gera presign/cria), validação de tipo/tamanho, filtro por empresa/origem/busca, dono para editar/excluir.
- Teste de integração do presign com um bucket R2 real de dev (upload + leitura pública).
- Manual: empresa aprovada publica um vídeo curto (mp4), aparece na seção, toca no player; editar e excluir; busca e chips.
- `check`, `migrate`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Comentários/curtidas em aula (a Rede trata interações sociais).
- Transcodificação/geração automática de thumbnail no servidor (MVP usa quadro do vídeo no cliente ou placeholder).
