"""
Views — aulas (Por ELAS finance).

Fluxo de upload:
  1. empresa aprovada chama POST /api/aulas/upload-url/ (valida tipo/tamanho)
  2. navegador faz PUT do arquivo direto no R2 (com progresso)
  3. navegador confirma com POST /api/aulas/ passando a chave do objeto
"""

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Company

from . import storage
from .models import Lesson
from .permissions import EmpresaAprovada
from .serializers import (
    LessonCreateSerializer,
    LessonEditSerializer,
    LessonSerializer,
    UploadUrlSerializer,
)


def _profile(request):
    return request.user.profile


class AulasView(APIView):
    """GET lista paginada (filtros) e POST cria aula (empresa aprovada)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), EmpresaAprovada()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Lesson.objects.select_related("company").all()

        empresa = request.query_params.get("empresa")
        origem = request.query_params.get("origem")
        q = request.query_params.get("q")

        if origem == Lesson.ORIGEM_IA:
            qs = qs.filter(origem=Lesson.ORIGEM_IA)
        elif empresa:
            qs = qs.filter(company__slug=empresa)
        if q:
            qs = qs.filter(titulo__icontains=q.strip())

        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = LessonSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def post(self, request):
        profile = _profile(request)
        ser = LessonCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        dados = ser.validated_data

        video_key = dados["video_key"]
        thumb_key = dados.get("thumb_key", "")
        aula = Lesson.objects.create(
            company=profile.company,
            autor=profile,
            origem=Lesson.ORIGEM_EMPRESA,
            titulo=dados["titulo"],
            descricao=dados.get("descricao", ""),
            video_key=video_key,
            video_url=storage.url_publica(video_key),
            thumb_key=thumb_key,
            thumb_url=storage.url_publica(thumb_key) if thumb_key else "",
            duracao_seg=dados.get("duracao_seg", 0),
            tamanho_bytes=dados.get("tamanho_bytes", 0),
        )
        return Response(
            LessonSerializer(aula).data, status=status.HTTP_201_CREATED
        )


class AulaDetailView(APIView):
    """GET detalhe, PATCH edita e DELETE exclui (dono = mesma empresa)."""

    permission_classes = [IsAuthenticated]

    def _dono(self, request, aula: Lesson) -> bool:
        profile = _profile(request)
        return bool(
            aula.company_id
            and profile.company_id
            and aula.company_id == profile.company_id
        )

    def get(self, request, pk):
        aula = get_object_or_404(Lesson.objects.select_related("company"), pk=pk)
        data = LessonSerializer(aula).data
        data["pode_editar"] = self._dono(request, aula)
        return Response(data)

    def patch(self, request, pk):
        aula = get_object_or_404(Lesson, pk=pk)
        if not self._dono(request, aula):
            return Response(
                {"detail": "Você só pode editar aulas da sua empresa."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = LessonEditSerializer(aula, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        # Se mandou nova thumb_key, recalcula a URL pública.
        thumb_key = ser.validated_data.get("thumb_key")
        if thumb_key:
            aula.thumb_url = storage.url_publica(thumb_key)
        ser.save()
        aula.refresh_from_db()
        return Response(LessonSerializer(aula).data)

    def delete(self, request, pk):
        aula = get_object_or_404(Lesson, pk=pk)
        if not self._dono(request, aula):
            return Response(
                {"detail": "Você só pode excluir aulas da sua empresa."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Remove os objetos do R2 (silencioso se não configurado).
        storage.deletar(aula.video_key)
        storage.deletar(aula.thumb_key)
        aula.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EmpresasComAulasView(APIView):
    """Empresas que têm aulas — para os chips (com logo)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresas = (
            Company.objects.filter(aulas__isnull=False)
            .annotate(total_aulas=Count("aulas"))
            .values("nome", "slug", "logo", "total_aulas")
            .order_by("nome")
            .distinct()
        )
        tem_ia = Lesson.objects.filter(origem=Lesson.ORIGEM_IA).exists()
        return Response({"empresas": list(empresas), "tem_ia": tem_ia})


class UploadUrlView(APIView):
    """Gera a URL pré-assinada para upload direto no R2 (empresa aprovada)."""

    permission_classes = [IsAuthenticated, EmpresaAprovada]

    def post(self, request):
        if not storage.r2_configurado():
            return Response(
                {
                    "code": "r2_indisponivel",
                    "detail": "Armazenamento de vídeos não configurado.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        ser = UploadUrlSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        tipo = ser.validated_data["tipo"]
        content_type = ser.validated_data["content_type"]
        tamanho = ser.validated_data["tamanho"]

        try:
            ext = storage.validar_upload(tipo, content_type, tamanho)
        except storage.UploadInvalido as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )

        profile = _profile(request)
        company_slug = profile.company.slug if profile.company else None
        key = storage.gerar_chave(tipo, ext, company_slug)
        url = storage.presign_put(key, content_type)

        return Response(
            {
                "url": url,
                "key": key,
                "content_type": content_type,
                "metodo": "PUT",
            }
        )
