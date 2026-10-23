"""
Serializers — carreira (Por ELAS finance).
"""

from rest_framework import serializers

from .models import Area, CareerPlan


class AreaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ("slug", "nome", "resumo", "ordem")


class AreaDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = (
            "slug",
            "nome",
            "resumo",
            "descricao",
            "formacao",
            "certificacoes",
            "hard_skills",
            "soft_skills",
            "cargos_entrada",
            "mulheres",
        )


class CareerPlanSerializer(serializers.ModelSerializer):
    total_passos = serializers.IntegerField(read_only=True)
    concluidos = serializers.IntegerField(read_only=True)

    class Meta:
        model = CareerPlan
        fields = (
            "titulo",
            "passos",
            "total_passos",
            "concluidos",
            "criado_em",
            "atualizado_em",
        )
