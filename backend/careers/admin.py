"""
Django Admin — carreira (Por ELAS finance).
"""

from django.contrib import admin

from .models import Area, CareerPlan


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ("nome", "slug", "ordem", "atualizado_em")
    search_fields = ("nome", "resumo", "descricao")
    prepopulated_fields = {"slug": ("nome",)}
    ordering = ("ordem", "nome")


@admin.register(CareerPlan)
class CareerPlanAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "titulo", "total_passos", "concluidos", "atualizado_em")
    search_fields = ("profile__username", "titulo")
    readonly_fields = ("criado_em", "atualizado_em")
