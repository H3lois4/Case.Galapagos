"""
Django Admin — aulas (Por ELAS finance).

As URLs do R2 ficam editáveis para permitir cadastrar o "Básico com IA" e o
seed apontando para objetos já enviados ao bucket.
"""

from django.contrib import admin

from .models import Lesson


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("titulo", "origem", "company", "duracao_seg", "publicado_em")
    list_filter = ("origem", "company")
    search_fields = ("titulo", "descricao")
    autocomplete_fields = ("company", "autor")
    readonly_fields = ("publicado_em", "atualizado_em")
    fields = (
        "titulo",
        "descricao",
        "origem",
        "company",
        "autor",
        "video_key",
        "video_url",
        "thumb_key",
        "thumb_url",
        "duracao_seg",
        "tamanho_bytes",
        "publicado_em",
        "atualizado_em",
    )
