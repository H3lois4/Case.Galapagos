"""
Serializers — aulas (Por ELAS finance).
"""

from rest_framework import serializers

from .models import Lesson


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

    video_key = serializers.CharField(max_length=512)
    thumb_key = serializers.CharField(max_length=512, required=False, allow_blank=True)

    class Meta:
        model = Lesson
        fields = (
            "titulo",
            "descricao",
            "video_key",
            "thumb_key",
            "duracao_seg",
            "tamanho_bytes",
        )

    def validate_titulo(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe um título.")
        return value


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
