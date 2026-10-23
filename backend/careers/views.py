"""
Views — carreira (Por ELAS finance).
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Area, CareerPlan
from .serializers import (
    AreaDetailSerializer,
    AreaListSerializer,
    CareerPlanSerializer,
)
from .services import gerar_plano, normalizar_passos


def _profile(request):
    return request.user.profile


class AreasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        areas = Area.objects.all()
        return Response(AreaListSerializer(areas, many=True).data)


class AreaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        area = get_object_or_404(Area, slug=slug)
        return Response(AreaDetailSerializer(area).data)


class GerarPlanoView(APIView):
    """Gera um rascunho de plano via IA (não salva)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        contexto = (request.data.get("contexto") or "").strip()

        # Se vier uma conversa de carreira, usa o histórico como contexto.
        conversa_id = request.data.get("conversa_id")
        if conversa_id and not contexto:
            from ai.models import Conversation

            conversa = Conversation.objects.filter(
                pk=conversa_id, profile=_profile(request)
            ).first()
            if conversa:
                linhas = [
                    f"{m.papel}: {m.conteudo}"
                    for m in conversa.mensagens.order_by("ordem")
                ]
                contexto = "\n".join(linhas)

        try:
            rascunho = gerar_plano(contexto)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        return Response(rascunho)


class PlanoView(APIView):
    """GET / PUT / DELETE do plano de carreira da usuária (um por usuária)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        plano = CareerPlan.objects.filter(profile=_profile(request)).first()
        if not plano:
            return Response(
                {"detail": "Sem plano salvo."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(CareerPlanSerializer(plano).data)

    def put(self, request):
        profile = _profile(request)
        titulo = (request.data.get("titulo") or "").strip() or "Meu plano de carreira"
        passos = normalizar_passos(request.data.get("passos"))
        if not passos:
            return Response(
                {"detail": "Informe ao menos um passo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        plano, _ = CareerPlan.objects.update_or_create(
            profile=profile, defaults={"titulo": titulo, "passos": passos}
        )
        return Response(
            CareerPlanSerializer(plano).data, status=status.HTTP_200_OK
        )

    def delete(self, request):
        CareerPlan.objects.filter(profile=_profile(request)).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanoPassoView(APIView):
    """Marca/desmarca um passo como concluído."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, passo_id):
        plano = CareerPlan.objects.filter(profile=_profile(request)).first()
        if not plano:
            return Response(
                {"detail": "Sem plano salvo."}, status=status.HTTP_404_NOT_FOUND
            )
        concluido = bool(request.data.get("concluido"))
        achou = False
        for p in plano.passos:
            if int(p.get("id", -1)) == int(passo_id):
                p["concluido"] = concluido
                achou = True
                break
        if not achou:
            return Response(
                {"detail": "Passo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        plano.save(update_fields=["passos", "atualizado_em"])
        return Response(CareerPlanSerializer(plano).data)
