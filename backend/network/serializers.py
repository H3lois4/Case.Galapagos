"""
Serializers — Rede (Por ELAS finance).
"""

from rest_framework import serializers

from .models import Comment, Post


def autor_dict(post: Post) -> dict:
    """Representa o autor do post com um 'tipo' para o selo visual."""
    if post.origem_ia:
        return {"tipo": "ia", "nome": "Por ELAS", "username": None, "slug": None, "foto": ""}
    if post.company_id:
        c = post.company
        return {
            "tipo": "empresa",
            "nome": c.nome,
            "username": None,
            "slug": c.slug,
            "foto": c.logo,
        }
    if post.autor_id:
        a = post.autor
        return {
            "tipo": "usuaria",
            "nome": a.nome_exibicao or a.username or "",
            "username": a.username,
            "slug": None,
            "foto": a.foto,
        }
    return {"tipo": "ia", "nome": "Por ELAS", "username": None, "slug": None, "foto": ""}


class CommentSerializer(serializers.ModelSerializer):
    autor_username = serializers.CharField(source="autor.username", read_only=True)
    autor_nome = serializers.SerializerMethodField()
    pode_excluir = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ("id", "texto", "autor_username", "autor_nome", "criado_em", "pode_excluir")

    def get_autor_nome(self, obj) -> str:
        return obj.autor.nome_exibicao or obj.autor.username or ""

    def get_pode_excluir(self, obj) -> bool:
        viewer = self.context.get("viewer")
        if not viewer:
            return False
        # dono do comentário OU dono do post
        return obj.autor_id == viewer.pk or obj.post.autor_id == viewer.pk


class PostSerializer(serializers.ModelSerializer):
    autor = serializers.SerializerMethodField()
    curtiu = serializers.SerializerMethodField()
    pode_excluir = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "tipo",
            "origem_ia",
            "autor",
            "texto",
            "imagem_url",
            "vaga_cargo",
            "vaga_local",
            "vaga_link",
            "titulo",
            "categoria",
            "fonte_url",
            "curtidas_count",
            "comentarios_count",
            "curtiu",
            "pode_excluir",
            "criado_em",
        )

    def get_autor(self, obj) -> dict:
        return autor_dict(obj)

    def get_curtiu(self, obj) -> bool:
        curtidos = self.context.get("curtidos_ids")
        if curtidos is not None:
            return obj.id in curtidos
        return False

    def get_pode_excluir(self, obj) -> bool:
        viewer = self.context.get("viewer")
        if not viewer:
            return False
        if obj.autor_id and obj.autor_id == viewer.pk:
            return True
        # membro da empresa dona do post
        if obj.company_id and getattr(viewer, "company_id", None) == obj.company_id:
            return True
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    imagem_key = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Post
        fields = (
            "tipo",
            "texto",
            "imagem_key",
            "vaga_cargo",
            "vaga_local",
            "vaga_link",
            "titulo",
        )

    def validate_texto(self, value):
        if len(value) > 2000:
            raise serializers.ValidationError("O texto pode ter no máximo 2.000 caracteres.")
        return value

    def validate(self, attrs):
        tipo = attrs.get("tipo", Post.TIPO_POST)
        if tipo == Post.TIPO_POST and not (attrs.get("texto") or "").strip():
            # permite post só com imagem; valida na view se nem texto nem imagem
            pass
        if tipo == Post.TIPO_VAGA and not (attrs.get("vaga_cargo") or "").strip():
            raise serializers.ValidationError({"vaga_cargo": "Informe o cargo da vaga."})
        if tipo == Post.TIPO_NOTICIA and not (attrs.get("titulo") or "").strip():
            raise serializers.ValidationError({"titulo": "Informe o título da notícia."})
        return attrs
