"""
Django Admin — prática (Por ELAS finance).
"""

from django.contrib import admin

from .models import Interview, Question, QuizAttempt


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("tema", "enunciado", "ativo", "atualizado_em")
    list_filter = ("tema", "ativo")
    search_fields = ("enunciado", "chave")


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "tema", "nota", "total", "finalizado", "criado_em")
    list_filter = ("tema", "finalizado")
    search_fields = ("profile__username",)
    readonly_fields = ("criado_em", "finalizado_em")


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "vaga", "nota_geral", "criado_em")
    search_fields = ("profile__username", "vaga")
    readonly_fields = ("criado_em", "finalizado_em")
