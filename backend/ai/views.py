"""
Views — IA (Por ELAS finance).

Inclui o endpoint de chat em streaming (SSE). A resposta da IA só é persistida
quando o stream termina com sucesso; o rate limit é checado antes de abrir o
stream.
"""

from __future__ import annotations

import json

from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .agents import AGENTES, get_agente
from .models import Conversation, Message, MessageFeedback
from .providers import ProviderError, get_provider
from .ratelimit import checar_limite
from .serializers import (
    ChatInputSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
    FeedbackSerializer,
)
from .services import (
    construir_system,
    gerar_resumo,
    historico_para_modelo,
    titulo_a_partir,
)


def _profile(request):
    return request.user.profile


def _sse(evento: str, dados: dict) -> str:
    return f"event: {evento}\ndata: {json.dumps(dados, ensure_ascii=False)}\n\n"


class AgentesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            [{"chave": a.chave, "nome": a.nome} for a in AGENTES.values()]
        )


class ConversasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Conversation.objects.filter(profile=_profile(request))
        agente = request.query_params.get("agente")
        if agente:
            qs = qs.filter(agente=agente)
        return Response(ConversationSerializer(qs, many=True).data)

    def post(self, request):
        agente = (request.data.get("agente") or "").strip()
        if agente not in AGENTES:
            return Response(
                {"detail": "Agente inválido."}, status=status.HTTP_400_BAD_REQUEST
            )
        conversa = Conversation.objects.create(profile=_profile(request), agente=agente)
        return Response(
            ConversationSerializer(conversa).data, status=status.HTTP_201_CREATED
        )


class ConversaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        conversa = get_object_or_404(
            Conversation, pk=pk, profile=_profile(request)
        )
        return Response(ConversationDetailSerializer(conversa).data)

    def delete(self, request, pk):
        conversa = get_object_or_404(
            Conversation, pk=pk, profile=_profile(request)
        )
        conversa.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        conversa = get_object_or_404(
            Conversation, pk=pk, profile=_profile(request)
        )
        conversa.resumo = gerar_resumo(conversa)
        conversa.save(update_fields=["resumo", "atualizado_em"])
        return Response({"resumo": conversa.resumo})


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        profile = _profile(request)
        mensagem = get_object_or_404(
            Message, pk=pk, conversation__profile=profile, papel=Message.PAPEL_ASSISTANT
        )
        ser = FeedbackSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        MessageFeedback.objects.update_or_create(
            message=mensagem,
            defaults={"profile": profile, "util": ser.validated_data["util"]},
        )
        return Response({"ok": True, "util": ser.validated_data["util"]})


class ChatView(APIView):
    """POST com resposta em streaming SSE."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = _profile(request)
        ser = ChatInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        dados = ser.validated_data

        agente = get_agente(dados["agente"])
        if agente is None:
            return Response(
                {"detail": "Agente inválido."}, status=status.HTTP_400_BAD_REQUEST
            )

        texto = dados["mensagem"].strip()
        conversa_id = dados.get("conversa_id")

        # "Kickoff": mensagem vazia numa conversa existente cuja última mensagem
        # é da usuária (ex.: entrevista com o contexto já semeado). Nesse caso,
        # só geramos a resposta da IA a partir do histórico, sem nova mensagem.
        kickoff = not texto and bool(conversa_id)
        if not texto and not kickoff:
            return Response(
                {"detail": "Mensagem vazia."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Rate limit antes de qualquer trabalho.
        permitido, retry_after = checar_limite(profile)
        if not permitido:
            resp = Response(
                {
                    "detail": "Você atingiu o limite de mensagens por hora. "
                    "Tente novamente mais tarde.",
                    "retry_after": retry_after,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            resp["Retry-After"] = str(retry_after)
            return resp

        # Conversa: existente (dono) ou nova.
        if conversa_id:
            conversa = get_object_or_404(
                Conversation, pk=conversa_id, profile=profile, agente=agente.chave
            )
        else:
            conversa = Conversation.objects.create(
                profile=profile, agente=agente.chave
            )

        if kickoff:
            ultima = conversa.mensagens.order_by("-ordem").first()
            if ultima is None or ultima.papel != Message.PAPEL_USER:
                return Response(
                    {"detail": "Nada a responder."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            msg_user = ultima
        else:
            # Salva a mensagem da usuária.
            msg_user = Message.objects.create(
                conversation=conversa,
                papel=Message.PAPEL_USER,
                conteudo=texto,
                ordem=conversa.proxima_ordem,
            )
            if not conversa.titulo:
                conversa.titulo = titulo_a_partir(texto)
                conversa.save(update_fields=["titulo", "atualizado_em"])

        system = construir_system(agente, conversa)
        mensagens = historico_para_modelo(conversa)

        def stream():
            # Envia o id da conversa logo no início (útil quando era nova).
            yield _sse("meta", {"conversa_id": conversa.id, "user_message_id": msg_user.id})
            partes: list[str] = []
            try:
                provider = get_provider()
                for pedaco in provider.chat(
                    mensagens, system=system, stream=True, temperatura=agente.temperatura
                ):
                    partes.append(pedaco)
                    yield _sse("token", {"t": pedaco})
            except ProviderError as exc:
                yield _sse("error", {"detail": str(exc)})
                return
            except Exception as exc:  # rede/erro inesperado
                yield _sse("error", {"detail": f"Erro ao gerar resposta: {exc}"})
                return

            conteudo = "".join(partes).strip()
            if not conteudo:
                yield _sse("error", {"detail": "Resposta vazia do modelo."})
                return

            msg_ia = Message.objects.create(
                conversation=conversa,
                papel=Message.PAPEL_ASSISTANT,
                conteudo=conteudo,
                ordem=conversa.proxima_ordem,
            )
            conversa.save(update_fields=["atualizado_em"])
            yield _sse("done", {"message_id": msg_ia.id})

        resposta = StreamingHttpResponse(
            stream(), content_type="text/event-stream"
        )
        resposta["Cache-Control"] = "no-cache"
        resposta["X-Accel-Buffering"] = "no"
        return resposta
