"""
Django Admin — IA (Por ELAS finance).
"""

from django.contrib import admin

from .models import Conversation, Message, MessageFeedback


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("ordem", "papel", "conteudo", "criado_em")
    readonly_fields = ("criado_em",)
    ordering = ("ordem",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "agente", "profile", "titulo", "atualizado_em")
    list_filter = ("agente",)
    search_fields = ("titulo", "profile__username", "resumo")
    readonly_fields = ("criado_em", "atualizado_em")
    inlines = [MessageInline]


@admin.register(MessageFeedback)
class MessageFeedbackAdmin(admin.ModelAdmin):
    list_display = ("id", "util", "message", "profile", "criado_em")
    list_filter = ("util",)
    search_fields = ("profile__username", "message__conteudo")
    readonly_fields = ("criado_em",)
