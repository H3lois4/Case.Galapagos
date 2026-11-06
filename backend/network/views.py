"""
Views — Rede (Por ELAS finance).
"""

from __future__ import annotations

from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from lessons import storage
from lessons.permissions import EmpresaAprovada

from .models import Comment, Post, PostLike
from .serializers import (
    CommentSerializer,
    PostCreateSerializer,
    PostSerializer,
)


def _profile(request):
    return request.user.profile


class ImagemUploadUrlView(APIView):
    """URL pré-assinada para a imagem de um post da Rede.

    Diferente do upload de aulas (restrito a empresas aprovadas), qualquer
    usuária autenticada pode postar com imagem. Só aceita imagem.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not storage.r2_configurado():
            return Response(
                {"code": "r2_indisponivel", "detail": "Armazenamento não configurado."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        content_type = (request.data.get("content_type") or "").strip()
        try:
            tamanho = int(request.data.get("tamanho") or 0)
            ext = storage.validar_upload("imagem", content_type, tamanho)
        except (storage.UploadInvalido, ValueError, TypeError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        import uuid

        # Chave dedicada por usuária: rede/<sub>/<uuid>.<ext>
        key = f"rede/{_profile(request).supabase_sub}/{uuid.uuid4().hex}.{ext}"
        url = storage.presign_put(key, content_type)
        return Response(
            {"url": url, "key": key, "content_type": content_type, "metodo": "PUT"}
        )


def _ctx(request, posts):
    """Contexto do serializer: viewer + ids curtidos pela usuária."""
    viewer = _profile(request)
    ids = [p.id for p in posts]
    curtidos = set(
        PostLike.objects.filter(profile=viewer, post_id__in=ids).values_list(
            "post_id", flat=True
        )
    )
    return {"viewer": viewer, "curtidos_ids": curtidos}


class PostsView(APIView):
    def get_permissions(self):
        return [IsAuthenticated()]

    def get(self, request):
        viewer = _profile(request)
        qs = Post.objects.select_related("autor", "company").all()

        filtro = request.query_params.get("filtro", "todos")
        autor_username = request.query_params.get("autor")
        empresa_slug = request.query_params.get("empresa")

        if filtro == "vagas":
            qs = qs.filter(tipo=Post.TIPO_VAGA)
        elif filtro == "seguindo":
            # perfis e empresas que a usuária segue
            perfis = viewer.seguindo_set.filter(
                seguido_profile__isnull=False
            ).values_list("seguido_profile_id", flat=True)
            empresas = viewer.seguindo_set.filter(
                seguido_company__isnull=False
            ).values_list("seguido_company_id", flat=True)
            qs = qs.filter(
                Q(autor_id__in=list(perfis)) | Q(company_id__in=list(empresas))
            )

        if autor_username:
            qs = qs.filter(autor__username_ci=autor_username.lower())
        if empresa_slug:
            qs = qs.filter(company__slug=empresa_slug)

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = PostSerializer(page, many=True, context=_ctx(request, page)).data
        return paginator.get_paginated_response(data)

    def post(self, request):
        profile = _profile(request)
        ser = PostCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        dados = ser.validated_data
        tipo = dados.get("tipo", Post.TIPO_POST)
        eh_admin = getattr(profile, "is_admin", False)
        postar_como = dados.get("postar_como", "usuaria") if eh_admin else "usuaria"

        # vaga/noticia: empresa aprovada OU administradora podem publicar.
        if tipo in (Post.TIPO_VAGA, Post.TIPO_NOTICIA):
            if not (profile.empresa_aprovada or eh_admin):
                return Response(
                    {"code": "empresa_requerida", "detail": "Apenas empresas aprovadas podem publicar isso."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        imagem_key = (dados.get("imagem_key") or "").strip()
        # A imagem precisa ter sido enviada pela própria usuária (pasta dela no
        # R2). Sem isso, daria para apontar para arquivos de outras pessoas ou
        # de aulas — e excluir o post apagaria esse arquivo.
        if imagem_key and not imagem_key.startswith(f"rede/{profile.supabase_sub}/"):
            return Response(
                {"detail": "Imagem inválida. Envie a imagem novamente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        texto = (dados.get("texto") or "").strip()
        if tipo == Post.TIPO_POST and not texto and not imagem_key:
            return Response(
                {"detail": "Escreva algo ou adicione uma imagem."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post = Post(
            autor=profile,
            tipo=tipo,
            texto=texto,
            titulo=(dados.get("titulo") or "").strip(),
            categoria=(dados.get("categoria") or "").strip(),
            fonte_url=(dados.get("fonte_url") or "").strip(),
            vaga_cargo=(dados.get("vaga_cargo") or "").strip(),
            vaga_local=(dados.get("vaga_local") or "").strip(),
            vaga_link=(dados.get("vaga_link") or "").strip(),
        )

        # Define em nome de quem o post sai.
        if eh_admin and postar_como == "ia":
            # Por ELAS (conta oficial): sem autor/empresa, origem_ia.
            post.autor = None
            post.company = None
            post.origem_ia = True
        elif eh_admin and postar_como == "empresa":
            # Em nome da empresa (Galapagos). Usa a empresa da admin ou a 1ª aprovada.
            from accounts.models import Company

            empresa = profile.company or Company.objects.filter(
                status=Company.STATUS_APROVADA
            ).order_by("id").first()
            post.company = empresa
        elif not eh_admin and profile.empresa_aprovada and tipo in (
            Post.TIPO_VAGA,
            Post.TIPO_NOTICIA,
        ):
            # Fluxo normal de empresa aprovada: posts saem em nome da empresa.
            post.company = profile.company

        if imagem_key:
            post.imagem_key = imagem_key
            post.imagem_url = storage.url_publica(imagem_key)
        post.save()

        return Response(
            PostSerializer(post, context={"viewer": profile, "curtidos_ids": set()}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(APIView):
    """Detalhe público (para /post/[id] e Open Graph) e exclusão pelo dono."""

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        post = get_object_or_404(
            Post.objects.select_related("autor", "company"), pk=pk
        )
        ctx = {"viewer": None, "curtidos_ids": set()}
        # Se autenticada, enriquece com curtiu/pode_excluir.
        try:
            from accounts.authentication import SupabaseJWTAuthentication

            resultado = SupabaseJWTAuthentication().authenticate(request)
            if resultado:
                viewer = resultado[0].profile
                curtidos = set(
                    PostLike.objects.filter(profile=viewer, post=post).values_list(
                        "post_id", flat=True
                    )
                )
                ctx = {"viewer": viewer, "curtidos_ids": curtidos}
        except Exception:
            pass
        return Response(PostSerializer(post, context=ctx).data)

    def delete(self, request, pk):
        profile = _profile(request)
        post = get_object_or_404(Post, pk=pk)
        dono = (
            getattr(profile, "is_admin", False)
            or (post.autor_id == profile.pk)
            or (post.company_id and post.company_id == profile.company_id)
        )
        if not dono:
            return Response(
                {"detail": "Você só pode excluir seus próprios posts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if post.imagem_key:
            storage.deletar(post.imagem_key)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurtirView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        profile = _profile(request)
        post = get_object_or_404(Post, pk=pk)
        with transaction.atomic():
            like = PostLike.objects.filter(post=post, profile=profile).first()
            if like:
                like.delete()
                Post.objects.filter(pk=post.pk).update(
                    curtidas_count=F("curtidas_count") - 1
                )
                curtiu = False
            else:
                PostLike.objects.create(post=post, profile=profile)
                Post.objects.filter(pk=post.pk).update(
                    curtidas_count=F("curtidas_count") + 1
                )
                curtiu = True
        post.refresh_from_db(fields=["curtidas_count"])
        return Response({"curtiu": curtiu, "curtidas_count": post.curtidas_count})


class ComentariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        comentarios = post.comentarios.select_related("autor", "post").all()
        return Response(
            CommentSerializer(
                comentarios, many=True, context={"viewer": _profile(request)}
            ).data
        )

    def post(self, request, pk):
        profile = _profile(request)
        post = get_object_or_404(Post, pk=pk)
        texto = (request.data.get("texto") or "").strip()
        if not texto:
            return Response(
                {"detail": "Escreva um comentário."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            comentario = Comment.objects.create(post=post, autor=profile, texto=texto)
            Post.objects.filter(pk=post.pk).update(
                comentarios_count=F("comentarios_count") + 1
            )
        return Response(
            CommentSerializer(comentario, context={"viewer": profile}).data,
            status=status.HTTP_201_CREATED,
        )


class ComentarioDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        profile = _profile(request)
        comentario = get_object_or_404(Comment.objects.select_related("post"), pk=pk)
        dono = (
            getattr(profile, "is_admin", False)
            or comentario.autor_id == profile.pk
            or comentario.post.autor_id == profile.pk
        )
        if not dono:
            return Response(
                {"detail": "Sem permissão para excluir este comentário."},
                status=status.HTTP_403_FORBIDDEN,
            )
        post_id = comentario.post_id
        comentario.delete()
        Post.objects.filter(pk=post_id).update(
            comentarios_count=F("comentarios_count") - 1
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class NoticiasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Post.objects.filter(tipo=Post.TIPO_NOTICIA).select_related("company")[:10]
        return Response(
            PostSerializer(
                qs, many=True, context={"viewer": _profile(request), "curtidos_ids": set()}
            ).data
        )


class NewsRunView(APIView):
    """Job da IA de notícias — chamado pela Vercel Cron (protegido por CRON_SECRET)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        import hmac

        from django.conf import settings

        from .news import rodar_noticias

        segredo = getattr(settings, "CRON_SECRET", "")
        if not segredo:
            return Response(
                {"detail": "Cron não configurada."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        enviado = (
            request.headers.get("X-Cron-Secret")
            or request.query_params.get("secret")
            or ""
        )
        if not hmac.compare_digest(str(enviado), str(segredo)):
            return Response(
                {"detail": "Não autorizado."}, status=status.HTTP_401_UNAUTHORIZED
            )
        criadas = rodar_noticias()
        return Response({"criadas": criadas})
