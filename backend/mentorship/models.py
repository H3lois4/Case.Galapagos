"""
Modelos de mentoria — Por ELAS finance.

Empresas aprovadas cadastram horários (`MentorshipSlot`); usuárias reservam por
ordem de chegada (`Booking`). A integridade da "reserva única por slot" e do
"uma mentoria ativa por mês" é garantida no banco por constraints, além da
checagem em transação no serviço de agendamento.
"""

from django.db import models


class MentorshipSlot(models.Model):
    company = models.ForeignKey(
        "accounts.Company", on_delete=models.CASCADE, related_name="horarios_mentoria"
    )
    criado_por = models.ForeignKey(
        "accounts.Profile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="horarios_criados",
    )
    mentora_nome = models.CharField(max_length=120)
    mentora_cargo = models.CharField(max_length=120, blank=True)
    mentora_email = models.EmailField()
    tema = models.CharField(max_length=160)
    inicio = models.DateTimeField(db_index=True)
    duracao_min = models.PositiveIntegerField(default=45)
    # Desnormalizado para filtrar disponíveis rápido; a verdade é a Booking ativa.
    reservado = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Horário de mentoria"
        verbose_name_plural = "Horários de mentoria"
        ordering = ["inicio"]
        indexes = [
            models.Index(fields=["company", "inicio"]),
            models.Index(fields=["reservado", "inicio"]),
        ]

    def __str__(self) -> str:
        return f"{self.tema} — {self.mentora_nome} ({self.inicio:%d/%m %H:%M})"


class Booking(models.Model):
    STATUS_ATIVA = "ativa"
    STATUS_CANCELADA = "cancelada"
    STATUS_CHOICES = [
        (STATUS_ATIVA, "Ativa"),
        (STATUS_CANCELADA, "Cancelada"),
    ]

    slot = models.ForeignKey(
        MentorshipSlot, on_delete=models.CASCADE, related_name="reservas"
    )
    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="mentorias"
    )
    ano_mes = models.CharField(max_length=7, db_index=True)  # "2026-11" (mês da sessão)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_ATIVA
    )
    google_event_id = models.CharField(max_length=256, blank=True)
    meet_link = models.URLField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    cancelado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Mentoria reservada"
        verbose_name_plural = "Mentorias reservadas"
        ordering = ["-criado_em"]
        constraints = [
            # No máximo uma reserva ATIVA por slot (permite re-agendar após
            # cancelamento, pois a reserva cancelada deixa de contar).
            models.UniqueConstraint(
                fields=["slot"],
                condition=models.Q(status="ativa"),
                name="uma_reserva_ativa_por_slot",
            ),
            # No máximo uma mentoria ATIVA por usuária no mesmo mês da sessão.
            models.UniqueConstraint(
                fields=["profile", "ano_mes"],
                condition=models.Q(status="ativa"),
                name="uma_mentoria_ativa_por_mes",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.profile} → {self.slot} [{self.status}]"
