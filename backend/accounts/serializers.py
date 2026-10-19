"""
Serializers — contas e perfis (Por ELAS finance).
"""

import re

from rest_framework import serializers

from .models import Company, Profile

USERNAME_RE = re.compile(r"^[a-z0-9._]{3,30}$")


class CompanyPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("nome", "slug", "logo", "descricao", "site", "status")


class MeSerializer(serializers.ModelSerializer):
    """Perfil completo da própria usuária (inclui dados privados e flags)."""

    precisa_username = serializers.SerializerMethodField()
    empresa_status = serializers.SerializerMethodField()
    empresa = CompanyPublicSerializer(source="company", read_only=True)
    total_seguidores = serializers.IntegerField(read_only=True)
    total_seguindo = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profile
        fields = (
            "email",
            "username",
            "account_type",
            "empresa",
            "empresa_status",
            "nome_exibicao",
            "foto",
            "descricao",
            "linkedin",
            "precisa_username",
            "termos_aceitos_em",
            "total_seguidores",
            "total_seguindo",
            "criado_em",
        )
        read_only_fields = (
            "email",
            "username",
            "account_type",
            "termos_aceitos_em",
            "criado_em",
        )

    def get_precisa_username(self, obj) -> bool:
        return not obj.tem_username

    def get_empresa_status(self, obj):
        return obj.company.status if obj.company else None


class ProfileEditSerializer(serializers.ModelSerializer):
    """Campos que a própria usuária pode editar."""

    class Meta:
        model = Profile
        fields = ("nome_exibicao", "foto", "descricao", "linkedin")


class UsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)

    def validate_username(self, value: str) -> str:
        value = value.strip().lower()
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError(
                "Use 3 a 30 caracteres: letras minúsculas, números, ponto ou sublinhado."
            )
        qs = Profile.objects.filter(username_ci=value)
        profile = self.context.get("profile")
        if profile:
            qs = qs.exclude(pk=profile.pk)
        if qs.exists():
            raise serializers.ValidationError("Esse nome de usuário já está em uso.")
        return value


class TipoContaSerializer(serializers.Serializer):
    account_type = serializers.ChoiceField(
        choices=[Profile.TIPO_PESSOAL, Profile.TIPO_EMPRESA]
    )


class PublicProfileSerializer(serializers.ModelSerializer):
    """Perfil público de uma usuária (sem dados privados)."""

    empresa = CompanyPublicSerializer(source="company", read_only=True)
    total_seguidores = serializers.IntegerField(read_only=True)
    total_seguindo = serializers.IntegerField(read_only=True)
    seguindo = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "username",
            "nome_exibicao",
            "foto",
            "descricao",
            "linkedin",
            "account_type",
            "empresa",
            "total_seguidores",
            "total_seguindo",
            "seguindo",
        )

    def get_seguindo(self, obj) -> bool:
        viewer = self.context.get("viewer")
        if not viewer:
            return False
        return viewer.seguindo_set.filter(seguido_profile=obj).exists()
