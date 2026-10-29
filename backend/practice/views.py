"""
Views — prática (Por ELAS finance).
"""

from __future__ import annotations

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Interview, Question, QuizAttempt
from .serializers import (
    InterviewHistSerializer,
    InterviewSerializer,
    InterviewSetupSerializer,
    QuizAttemptHistSerializer,
)
from .services_interview import gerar_relatorio, iniciar_entrevista
from .services_quiz import (
    SemQuestoes,
    TemaInvalido,
    corrigir,
    iniciar,
    montar_resultado,
)
from .temas import NOME_POR_SLUG, TEMAS


def _profile(request):
    return request.user.profile


class TemasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contagem = {
            row["tema"]: row["n"]
            for row in Question.objects.filter(ativo=True)
            .values("tema")
            .annotate(n=Count("id"))
        }
        dados = [
            {"slug": t["slug"], "nome": t["nome"], "questoes": contagem.get(t["slug"], 0)}
            for t in TEMAS
        ]
        return Response(dados)


class SimuladoIniciarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tema = (request.data.get("tema") or "").strip()
        try:
            attempt, questoes = iniciar(_profile(request), tema)
        except TemaInvalido as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except SemQuestoes as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "attempt_id": attempt.id,
                "tema": tema,
                "tema_nome": NOME_POR_SLUG.get(tema, tema),
                "questoes": questoes,
            },
            status=status.HTTP_201_CREATED,
        )


class SimuladoResponderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        attempt = get_object_or_404(QuizAttempt, pk=pk, profile=_profile(request))
        respostas = request.data.get("respostas") or {}
        if not isinstance(respostas, dict):
            return Response(
                {"detail": "Formato de respostas inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            resultado = corrigir(attempt, respostas)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado)


class SimuladoHistoricoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = QuizAttempt.objects.filter(
            profile=_profile(request), finalizado=True
        )
        return Response(QuizAttemptHistSerializer(qs, many=True).data)


class SimuladoDetailView(APIView):
    """Rever o relatório completo de um simulado salvo (Minha jornada)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        attempt = get_object_or_404(
            QuizAttempt, pk=pk, profile=_profile(request), finalizado=True
        )
        resultado = montar_resultado(attempt)
        resultado["tema_nome"] = NOME_POR_SLUG.get(attempt.tema, attempt.tema)
        return Response(resultado)


class EntrevistaCriarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = InterviewSetupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        interview = iniciar_entrevista(_profile(request), ser.validated_data)
        return Response(
            InterviewSerializer(interview).data, status=status.HTTP_201_CREATED
        )


class EntrevistaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, profile=_profile(request))
        return Response(InterviewSerializer(interview).data)


class EntrevistaRelatorioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, profile=_profile(request))
        if interview.relatorio:
            return Response(interview.relatorio)
        try:
            relatorio = gerar_relatorio(interview)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        return Response(relatorio)


class EntrevistaHistoricoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Interview.objects.filter(profile=_profile(request))
        return Response(InterviewHistSerializer(qs, many=True).data)
