"""
Views — contas, perfis, verificação de empresa e seguir (Por ELAS finance).
"""

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Company, EmailVerification, Follow, Profile
from .serializers import (
    MeSerializer,
    ProfileEditSerializer,
    PublicProfileSerializer,
    TipoContaSerializer,
    UsernameSerializer,
)
from .services import (
    confirmar_codigo,
    criar_verificacao,
    dominio_gratuito,
    reenviar_codigo,
    vincular_empresa,
)


def _profile(request) -> Profile:
    return request.user.profile


class MeView(APIView):
    """GET / PATCH / DELETE do próprio perfil."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(_profile(request)).data)

    def patch(self, request):
        profile = _profile(request)
        ser = ProfileEditSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(MeSerializer(profile).data)

    def delete(self, request):
        _profile(request).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = _profile(request)
        ser = UsernameSerializer(data=request.data, context={"profile": profile})
        ser.is_valid(raise_exception=True)
        profile.username = ser.validated_data["username"]
        profile.save(update_fields=["username", "username_ci", "atualizado_em"])
        return Response(MeSerializer(profile).data)


class UsernameDisponivelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = (request.query_params.get("u") or "").strip().lower()
        ser = UsernameSerializer(
            data={"username": u}, context={"profile": _profile(request)}
        )
        disponivel = ser.is_valid()
        return Response(
            {
                "disponivel": disponivel,
                "erro": None if disponivel else ser.errors.get("username", [""])[0],
            }
        )


class AceiteTermosView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.conf import settings

        profile = _profile(request)
        profile.termos_aceitos_em = timezone.now()
        profile.termos_versao = settings.TERMOS_VERSAO
        profile.save(update_fields=["termos_aceitos_em", "termos_versao"])
        return Response({"ok": True, "versao": profile.termos_versao})


class TipoContaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = _profile(request)
        ser = TipoContaSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        profile.account_type = ser.validated_data["account_type"]
        profile.save(update_fields=["account_type", "atualizado_em"])
        return Response(MeSerializer(profile).data)


# --------------------------------------------------------------------------
# Verificação de empresa
# --------------------------------------------------------------------------
class EmpresaVerificarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = (request.data.get("email_corporativo") or "").strip().lower()
        nome = (request.data.get("nome_empresa") or "").strip()
        if not email or not nome:
            return Response(
                {"detail": "Informe o nome da empresa e o e-mail corporativo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if dominio_gratuito(email):
            return Response(
                {
                    "code": "dominio_gratuito",
                    "detail": "Use um e-mail corporativo, não um e-mail pessoal/gratuito.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        verificacao = criar_verificacao(
            _profile(request),
            {
                "email_corporativo": email,
                "nome_empresa": nome,
                "site": request.data.get("site", ""),
                "cnpj": request.data.get("cnpj", ""),
            },
        )
        return Response(
            {"verificacao_id": verificacao.id, "email": email},
            status=status.HTTP_201_CREATED,
        )


class EmpresaConfirmarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = _profile(request)
        codigo = (request.data.get("codigo") or "").strip()
        verificacao = (
            EmailVerification.objects.filter(profile=profile, consumido_em__isnull=True)
            .order_by("-criado_em")
            .first()
        )
        if not verificacao:
            return Response(
                {"detail": "Nenhuma verificação pendente. Inicie novamente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ok, erro = confirmar_codigo(verificacao, codigo)
        if not ok:
            return Response({"detail": erro}, status=status.HTTP_400_BAD_REQUEST)

        company = vincular_empresa(verificacao)
        return Response(
            {"empresa": company.nome, "status": company.status},
            status=status.HTTP_200_OK,
        )


class EmpresaReenviarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = _profile(request)
        verificacao = (
            EmailVerification.objects.filter(profile=profile, consumido_em__isnull=True)
            .order_by("-criado_em")
            .first()
        )
        if not verificacao:
            return Response(
                {"detail": "Nenhuma verificação pendente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reenviar_codigo(verificacao)
        return Response({"ok": True})


# --------------------------------------------------------------------------
# Perfil público e seguir
# --------------------------------------------------------------------------
class PerfilPublicoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, username):
        profile = Profile.objects.filter(username_ci=username.lower()).first()
        if not profile:
            return Response(
                {"detail": "Perfil não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Se houver token válido, descobre quem está vendo (para o estado "seguindo").
        viewer = None
        from .authentication import SupabaseJWTAuthentication

        try:
            resultado = SupabaseJWTAuthentication().authenticate(request)
            if resultado:
                viewer = resultado[0].profile
        except Exception:
            viewer = None

        data = PublicProfileSerializer(profile, context={"viewer": viewer}).data
        return Response(data)


class SeguirView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        seguidor = _profile(request)
        alvo = get_object_or_404(Profile, username_ci=username.lower())
        if alvo.pk == seguidor.pk:
            return Response(
                {"detail": "Você não pode seguir a si mesma."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            Follow.objects.get_or_create(seguidor=seguidor, seguido_profile=alvo)
        except IntegrityError:
            pass
        return Response({"seguindo": True, "total_seguidores": alvo.total_seguidores})

    def delete(self, request, username):
        seguidor = _profile(request)
        alvo = get_object_or_404(Profile, username_ci=username.lower())
        Follow.objects.filter(seguidor=seguidor, seguido_profile=alvo).delete()
        return Response({"seguindo": False, "total_seguidores": alvo.total_seguidores})
