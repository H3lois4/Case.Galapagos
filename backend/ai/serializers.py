"""
Serializers — IA (Por ELAS finance).
"""

from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    util = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "papel", "conteudo", "ordem", "criado_em", "util")

    def get_util(self, obj):
        fb = getattr(obj, "feedback", None)
        return fb.util if fb else None


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("id", "agente", "titulo", "resumo", "criado_em", "atualizado_em")


class ConversationDetailSerializer(serializers.ModelSerializer):
    mensagens = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = (
            "id",
            "agente",
            "titulo",
            "resumo",
            "criado_em",
            "atualizado_em",
            "mensagens",
        )


class ChatInputSerializer(serializers.Serializer):
    agente = serializers.CharField(max_length=40)
    mensagem = serializers.CharField()
    conversa_id = serializers.IntegerField(required=False)


class FeedbackSerializer(serializers.Serializer):
    util = serializers.BooleanField()
