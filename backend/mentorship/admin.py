"""
Django Admin — mentoria (Por ELAS finance).
"""

from django.contrib import admin

from .models import Booking, MentorshipSlot


@admin.register(MentorshipSlot)
class MentorshipSlotAdmin(admin.ModelAdmin):
    list_display = ("tema", "company", "mentora_nome", "inicio", "duracao_min", "reservado")
    list_filter = ("reservado", "company")
    search_fields = ("tema", "mentora_nome", "mentora_email", "company__nome")
    autocomplete_fields = ("company",)
    readonly_fields = ("criado_em",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "slot", "ano_mes", "status", "criado_em")
    list_filter = ("status", "ano_mes")
    search_fields = ("profile__username", "slot__tema")
    readonly_fields = ("criado_em", "cancelado_em")
