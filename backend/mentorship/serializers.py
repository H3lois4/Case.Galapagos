"""
Serializers — mentoria (Por ELAS finance).
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Booking, MentorshipSlot


class SlotSerializer(serializers.ModelSerializer):
    empresa_nome = serializers.CharField(source="company.nome", read_only=True)
    empresa_slug = serializers.CharField(source="company.slug", read_only=True)

    class Meta:
        model = MentorshipSlot
        fields = (
            "id",
            "empresa_nome",
            "empresa_slug",
            "mentora_nome",
            "mentora_cargo",
            "tema",
            "inicio",
            "duracao_min",
            "reservado",
        )


class SlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorshipSlot
        fields = (
            "mentora_nome",
            "mentora_cargo",
            "mentora_email",
            "tema",
            "inicio",
            "duracao_min",
        )

    def validate_inicio(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("A data precisa estar no futuro.")
        return value

    def validate_tema(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe o tema.")
        return value


class BookingSerializer(serializers.ModelSerializer):
    slot = SlotSerializer(read_only=True)
    passada = serializers.SerializerMethodField()
    pode_cancelar = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id",
            "slot",
            "status",
            "meet_link",
            "criado_em",
            "passada",
            "pode_cancelar",
        )

    def get_passada(self, obj) -> bool:
        return obj.slot.inicio <= timezone.now()

    def get_pode_cancelar(self, obj) -> bool:
        from .services import JANELA_CANCELAMENTO

        return (
            obj.status == Booking.STATUS_ATIVA
            and (obj.slot.inicio - timezone.now()) >= JANELA_CANCELAMENTO
        )
