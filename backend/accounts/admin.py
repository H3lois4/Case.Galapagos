"""
Django Admin — contas e empresas (Por ELAS finance).
"""

from django.contrib import admin
from django.utils import timezone

from .models import Company, EmailVerification, Follow, Profile


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("nome", "dominio", "status", "criada_em")
    list_filter = ("status",)
    search_fields = ("nome", "dominio", "site")
    prepopulated_fields = {"slug": ("nome",)}
    actions = ["aprovar_empresas", "rejeitar_empresas"]

    @admin.action(description="Aprovar empresas selecionadas")
    def aprovar_empresas(self, request, queryset):
        n = queryset.update(status=Company.STATUS_APROVADA)
        self.message_user(request, f"{n} empresa(s) aprovada(s).")

    @admin.action(description="Rejeitar empresas selecionadas")
    def rejeitar_empresas(self, request, queryset):
        n = queryset.update(status=Company.STATUS_REJEITADA)
        self.message_user(request, f"{n} empresa(s) rejeitada(s).")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "account_type", "company", "criado_em")
    list_filter = ("account_type", "company__status")
    search_fields = ("username", "email", "nome_exibicao")
    autocomplete_fields = ("company",)
    readonly_fields = ("supabase_sub", "username_ci", "criado_em", "atualizado_em")


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "email_corporativo",
        "nome_empresa",
        "profile",
        "tentativas",
        "expira_em",
        "consumido_em",
    )
    search_fields = ("email_corporativo", "nome_empresa")
    readonly_fields = ("codigo_hash", "criado_em")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("seguidor", "seguido_profile", "seguido_company", "criado_em")
    search_fields = ("seguidor__username",)
