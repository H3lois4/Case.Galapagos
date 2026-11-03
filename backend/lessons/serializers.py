"""
Serializers — aulas (Por ELAS finance).
"""

import re

from rest_framework import serializers

from .models import Lesson

# Aceita as formas comuns de link do YouTube e extrai o ID de 11 caracteres:
#   https://www.youtube.com/watch?v=VIDEOID
#   https://youtu.be/VIDEOID
#   https://www.youtube.com/embed/VIDEOID
#   https://www.youtube.com/shorts/VIDEOID
_YT_PADROES = [
    re.compile(r"(?:youtube\.com/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtu\.be/)([A-Za-z0-9_-]{11})"),
    re.compile(r"(?:youtube\.com/(?:embed|shorts|v)/)([A-Za-z0-9_-]{11})"),
]


def extrair_youtube_id(url: str) -> str | None:
    """Retorna o ID do vídeo do YouTube a partir da URL, ou None se inválida."""
    url = (url or "").strip()
    if not url:
        return None
    # Caso a pessoa cole apenas o ID (11 chars válidos).
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    for padrao in _YT_PADROES:
        m = padrao.search(url)
        if m:
            return m.group(1)
    return None


class LessonSerializer(serializers.ModelSerializer):
    """Representação de leitura de uma aula (lista e detalhe/player)."""

    empresa_nome = serializers.SerializerMethodField()
    empresa_slug = serializers.SerializerMethodField()
    empresa_logo = serializers.SerializerMethodField()
    autor_nome = serializers.CharField(source="nome_autor", read_only=True)

    class Meta:
        model = Lesson
        fields = (
            "id",
            "titulo",
            "descricao",
            "origem",
            "empresa_nome",
            "empresa_slug",
            "empresa_logo",
            "autor_nome",
            "video_url",
            "youtube_id",
            "thumb_url",
            "duracao_seg",
            "tamanho_bytes",
            "publicado_em",
        )

    def get_empresa_nome(self, obj) -> str | None:
        return obj.company.nome if obj.company else None

    def get_empresa_slug(self, obj) -> str | None:
        return obj.company.slug if obj.company else None

    def get_empresa_logo(self, obj) -> str:
        return obj.company.logo if obj.company else ""


class LessonCreateSerializer(serializers.ModelSerializer):
    """Criação da aula após o upload concluído no R2."""

    # O conteúdo pode vir de um upload no R2 (video_key) OU de um link do
    # YouTube (youtube_url). Exatamente um dos dois é obrigatório.
    video_key = serializers.CharField(
        max_length=512, required=False, allow_blank=True
    )
    youtube_url = serializers.CharField(
        max_length=300, required=False, allow_blank=True, write_only=True
    )
    thumb_key = serializers.CharField(max_length=512, required=False, allow_blank=True)
    # Só a administradora usa: "ia" publica como Por ELAS; "empresa" publica
    # como a empresa que ela representa (Galapagos). Ignorado para empresas.
    postar_como = serializers.ChoiceField(
        choices=["ia", "empresa"], required=False, write_only=True
    )

    class Meta:
        model = Lesson
        fields = (
            "titulo",
            "descricao",
            "video_key",
            "youtube_url",
            "thumb_key",
            "duracao_seg",
            "tamanho_bytes",
            "postar_como",
        )

    def validate_titulo(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe um título.")
        return value

    def validate(self, attrs):
        video_key = (attrs.get("video_key") or "").strip()
        youtube_url = (attrs.get("youtube_url") or "").strip()

        if video_key and youtube_url:
            raise serializers.ValidationError(
                "Envie um vídeo OU um link do YouTube, não os dois."
            )
        if not video_key and not youtube_url:
            raise serializers.ValidationError(
                "Envie um arquivo de vídeo ou informe o link do YouTube."
            )

        if youtube_url:
            yt_id = extrair_youtube_id(youtube_url)
            if not yt_id:
                raise serializers.ValidationError(
                    {"youtube_url": "Link do YouTube inválido."}
                )
            attrs["youtube_id"] = yt_id
        return attrs


class LessonEditSerializer(serializers.ModelSerializer):
    """Edição de metadados (título, descrição, thumb) pela empresa dona."""

    class Meta:
        model = Lesson
        fields = ("titulo", "descricao", "thumb_key", "thumb_url")


class UploadUrlSerializer(serializers.Serializer):
    """Pedido de URL pré-assinada para upload direto no R2."""

    tipo = serializers.ChoiceField(choices=["video", "imagem"])
    content_type = serializers.CharField(max_length=100)
    tamanho = serializers.IntegerField(min_value=1)
