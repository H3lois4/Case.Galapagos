"""
Serializers — prática (Por ELAS finance).
"""

from rest_framework import serializers

from .models import Interview, QuizAttempt


class QuizAttemptHistSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ("id", "tema", "nota", "total", "finalizado", "criado_em")


class InterviewSetupSerializer(serializers.Serializer):
    vaga = serializers.CharField(max_length=160)
    papel_entrevistador = serializers.CharField(
        max_length=120, required=False, allow_blank=True
    )
    tipo = serializers.CharField(max_length=60, required=False, allow_blank=True)
    nivel = serializers.CharField(max_length=40, required=False, allow_blank=True)
    idioma = serializers.ChoiceField(choices=["pt", "en"], default="pt")
    descricao = serializers.CharField(required=False, allow_blank=True)

    def validate_vaga(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe a vaga.")
        return value


class InterviewSerializer(serializers.ModelSerializer):
    conversa_id = serializers.IntegerField(source="conversation_id", read_only=True)

    class Meta:
        model = Interview
        fields = (
            "id",
            "vaga",
            "papel_entrevistador",
            "tipo",
            "nivel",
            "idioma",
            "descricao",
            "conversa_id",
            "relatorio",
            "nota_geral",
            "criado_em",
            "finalizado_em",
        )


class InterviewHistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ("id", "vaga", "nota_geral", "criado_em", "finalizado_em")
