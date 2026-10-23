"""
Serviços de mentoria — Por ELAS finance.

O agendamento é atômico: trava o slot com `select_for_update`, valida
disponibilidade e o limite de 1 por mês, e cria a `Booking`. As constraints do
banco (OneToOne no slot + única parcial por mês) seguram a corrida mesmo em
SQLite, onde `select_for_update` é no-op. Os efeitos colaterais (Google Agenda
e e-mail) rodam fora da transação, em melhor esforço.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone

from . import google_calendar
from .models import Booking, MentorshipSlot

logger = logging.getLogger(__name__)

JANELA_CANCELAMENTO = timedelta(hours=24)


class Indisponivel(Exception):
    """O horário não está disponível (passado, já reservado, corrida)."""


class LimiteMensal(Exception):
    """A usuária já tem uma mentoria ativa neste mês."""


class ForaDaJanela(Exception):
    """Cancelamento fora da janela permitida (menos de 24 h)."""


def agendar(profile, slot_id: int) -> Booking:
    """Reserva o slot para a usuária, de forma atômica."""
    try:
        with transaction.atomic():
            try:
                slot = MentorshipSlot.objects.select_for_update().get(pk=slot_id)
            except MentorshipSlot.DoesNotExist:
                raise Indisponivel("Horário não encontrado.")

            if slot.inicio <= timezone.now():
                raise Indisponivel("Este horário já passou.")
            if slot.reservado or Booking.objects.filter(
                slot=slot, status=Booking.STATUS_ATIVA
            ).exists():
                raise Indisponivel("Horário já reservado.")

            ano_mes = slot.inicio.strftime("%Y-%m")
            if Booking.objects.filter(
                profile=profile, ano_mes=ano_mes, status=Booking.STATUS_ATIVA
            ).exists():
                raise LimiteMensal("Você já tem uma mentoria agendada neste mês.")

            booking = Booking.objects.create(
                slot=slot, profile=profile, ano_mes=ano_mes
            )
            slot.reservado = True
            slot.save(update_fields=["reservado"])
    except IntegrityError:
        # Corrida que escapou do lock (ex.: SQLite): a constraint barrou.
        # Pode ser slot já reservado OU limite mensal; mensagem conservadora.
        raise Indisponivel("Horário já reservado.")

    _pos_reserva(booking)
    return booking


def cancelar(profile, booking_id: int) -> Booking:
    """Cancela a mentoria da usuária, se dentro da janela de 24 h."""
    try:
        booking = Booking.objects.select_related("slot").get(
            pk=booking_id, profile=profile
        )
    except Booking.DoesNotExist:
        raise Indisponivel("Mentoria não encontrada.")

    if booking.status != Booking.STATUS_ATIVA:
        raise Indisponivel("Esta mentoria não está ativa.")

    if booking.slot.inicio - timezone.now() < JANELA_CANCELAMENTO:
        raise ForaDaJanela(
            "Só é possível cancelar até 24 horas antes do início."
        )

    with transaction.atomic():
        booking.status = Booking.STATUS_CANCELADA
        booking.cancelado_em = timezone.now()
        booking.save(update_fields=["status", "cancelado_em"])
        slot = booking.slot
        slot.reservado = False
        slot.save(update_fields=["reservado"])

    _pos_cancelamento(booking)
    return booking


# --------------------------------------------------------------------------
# Efeitos colaterais (melhor esforço — nunca quebram a reserva)
# --------------------------------------------------------------------------
def _pos_reserva(booking: Booking) -> None:
    try:
        event_id, meet = google_calendar.criar_evento(booking)
        if event_id or meet:
            booking.google_event_id = event_id
            booking.meet_link = meet
            booking.save(update_fields=["google_event_id", "meet_link"])
    except Exception as exc:  # pragma: no cover
        logger.warning("pós-reserva (calendar) falhou: %s", exc)

    _enviar_email_confirmacao(booking)


def _pos_cancelamento(booking: Booking) -> None:
    try:
        google_calendar.cancelar_evento(booking.google_event_id)
    except Exception as exc:  # pragma: no cover
        logger.warning("pós-cancelamento (calendar) falhou: %s", exc)


def _enviar_email_confirmacao(booking: Booking) -> None:
    slot = booking.slot
    email = getattr(booking.profile, "email", "")
    if not email:
        return
    quando = timezone.localtime(slot.inicio).strftime("%d/%m/%Y às %H:%M")
    linhas = [
        "Olá!",
        "",
        f"Sua mentoria foi agendada: {slot.tema}.",
        f"Com {slot.mentora_nome}"
        f"{f' ({slot.mentora_cargo})' if slot.mentora_cargo else ''}, "
        f"de {slot.company.nome}.",
        f"Quando: {quando} (duração {slot.duracao_min} min).",
    ]
    if booking.meet_link:
        linhas.append(f"Link da reunião: {booking.meet_link}")
    linhas += ["", "Com carinho,", "Equipe Por ELAS finance"]
    try:
        send_mail(
            "Mentoria agendada — Por ELAS finance",
            "\n".join(linhas),
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=True,
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("e-mail de confirmação falhou: %s", exc)
