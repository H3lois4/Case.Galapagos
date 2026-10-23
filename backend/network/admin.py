"""
Django Admin — Rede (Por ELAS finance).
"""

from django.contrib import admin

from .models import Comment, Post, PostLike
from .news import rodar_noticias


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "tipo", "origem_ia", "autor", "company", "titulo", "criado_em")
    list_filter = ("tipo", "origem_ia")
    search_fields = ("texto", "titulo", "vaga_cargo", "company__nome", "autor__username")
    readonly_fields = ("curtidas_count", "comentarios_count", "criado_em")
    actions = ["rodar_ia_noticias"]

    @admin.action(description="Rodar IA de notícias agora")
    def rodar_ia_noticias(self, request, queryset):
        try:
            criadas = rodar_noticias()
            self.message_user(request, f"{criadas} notícia(s) criada(s).")
        except Exception as exc:  # pragma: no cover
            self.message_user(request, f"Falha: {exc}", level="error")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "autor", "post", "criado_em")
    search_fields = ("texto", "autor__username")
    readonly_fields = ("criado_em",)


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "post", "criado_em")
