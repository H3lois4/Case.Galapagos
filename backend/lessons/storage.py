"""
Armazenamento no Cloudflare R2 (compatível com S3) — Por ELAS finance.

O upload vai direto do navegador para o R2 usando uma URL pré-assinada (PUT)
gerada aqui com boto3. O arquivo nunca passa pelo backend serverless. A leitura
é feita pela URL pública do bucket (R2_PUBLIC_BASE_URL).

As credenciais (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) ficam só no backend,
nunca no front nem no Git.
"""

from __future__ import annotations

import uuid

from django.conf import settings


class R2ConfigError(RuntimeError):
    """O R2 não está configurado (faltam variáveis de ambiente)."""


class UploadInvalido(ValueError):
    """Tipo ou tamanho do arquivo fora das regras permitidas."""


# Content-Types aceitos por tipo de upload e a extensão usada na chave.
TIPOS_VIDEO = {
    "video/mp4": "mp4",
    "video/webm": "webm",
}
TIPOS_IMAGEM = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def r2_configurado() -> bool:
    return bool(
        settings.R2_ACCOUNT_ID
        and settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET
    )


def _endpoint() -> str:
    return (
        settings.R2_ENDPOINT
        or f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    )


def _client():
    if not r2_configurado():
        raise R2ConfigError(
            "R2 não configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY e R2_BUCKET no ambiente."
        )
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=_endpoint(),
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def validar_upload(tipo: str, content_type: str, tamanho: int) -> str:
    """Valida o upload e devolve a extensão da chave.

    `tipo` é "video" ou "imagem"; `content_type` é o MIME enviado pelo cliente.
    Lança UploadInvalido com mensagem clara se algo estiver fora das regras.
    """
    content_type = (content_type or "").lower().strip()
    tamanho = int(tamanho or 0)

    if tipo == "video":
        permitidos = TIPOS_VIDEO
        max_bytes = settings.UPLOAD_VIDEO_MAX_BYTES
        rotulo = "vídeo"
    elif tipo == "imagem":
        permitidos = TIPOS_IMAGEM
        max_bytes = settings.UPLOAD_IMG_MAX_BYTES
        rotulo = "imagem"
    else:
        raise UploadInvalido("Tipo de upload inválido.")

    if content_type not in permitidos:
        aceitos = ", ".join(sorted(permitidos))
        raise UploadInvalido(
            f"Formato de {rotulo} não suportado. Aceitos: {aceitos}."
        )
    if tamanho <= 0:
        raise UploadInvalido("Tamanho do arquivo inválido.")
    if tamanho > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise UploadInvalido(f"Arquivo de {rotulo} acima do limite de {mb} MB.")

    return permitidos[content_type]


def gerar_chave(tipo: str, ext: str, company_slug: str | None) -> str:
    """Monta a chave do objeto: aulas/<empresa|ia>/<video|thumb>/<uuid>.<ext>."""
    prefixo = company_slug or "ia"
    sub = "videos" if tipo == "video" else "thumbs"
    return f"aulas/{prefixo}/{sub}/{uuid.uuid4().hex}.{ext}"


def presign_put(key: str, content_type: str, expira: int | None = None) -> str:
    """Gera a URL pré-assinada para o PUT direto no R2.

    O cliente deve enviar o mesmo Content-Type usado aqui, senão a assinatura
    não bate. A URL expira em `expira` segundos (padrão UPLOAD_URL_TTL).
    """
    expira = int(expira or settings.UPLOAD_URL_TTL)
    return _client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.R2_BUCKET,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expira,
    )


def url_publica(key: str) -> str:
    base = (settings.R2_PUBLIC_BASE_URL or "").rstrip("/")
    return f"{base}/{key}"


def deletar(key: str) -> None:
    """Remove o objeto do bucket. Silencioso se o R2 não estiver configurado."""
    if not key or not r2_configurado():
        return
    try:
        _client().delete_object(Bucket=settings.R2_BUCKET, Key=key)
    except Exception:
        # A exclusão da aula não deve falhar por causa do R2; o objeto órfão
        # pode ser limpo depois. Em produção vale logar isso.
        pass
