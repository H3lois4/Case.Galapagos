"""
Integração opcional com o Google Agenda — Por ELAS finance.

Usa a conta Google da plataforma (OAuth com refresh token em variável de
ambiente). Se as credenciais não estiverem configuradas, tudo vira no-op e o
agendamento segue sem o evento (degradação graciosa — requisito 7.3).

Nunca lança: erros são logados e engolidos, para não quebrar a reserva.
"""

from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def configurado() -> bool:
    return bool(
        settings.GOOGLE_CLIENT_ID
        and settings.GOOGLE_CLIENT_SECRET
        and settings.GOOGLE_REFRESH_TOKEN
    )


def _service():
    if not configurado():
        return None
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        creds = Credentials(
            token=None,
            refresh_token=settings.GOOGLE_REFRESH_TOKEN,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri=TOKEN_URI,
            scopes=SCOPES,
        )
        return build("calendar", "v3", credentials=creds, cache_discovery=False)
    except Exception as exc:  # pragma: no cover - depende de credenciais reais
        logger.warning("Google Calendar indisponível: %s", exc)
        return None


def criar_evento(booking) -> tuple[str, str]:
    """Cria o evento com Meet e convida usuária + mentora.

    Retorna (event_id, meet_link). Se não configurado/erro, retorna ("", "").
    """
    service = _service()
    if service is None:
        return "", ""

    slot = booking.slot
    from datetime import timedelta

    fim = slot.inicio + timedelta(minutes=slot.duracao_min)
    tz = getattr(settings, "TIME_ZONE", "America/Sao_Paulo")

    convidados = []
    email_usuaria = getattr(booking.profile, "email", "")
    if email_usuaria:
        convidados.append({"email": email_usuaria})
    if slot.mentora_email:
        convidados.append({"email": slot.mentora_email})

    corpo = {
        "summary": f"Mentoria Por ELAS: {slot.tema}",
        "description": (
            f"Mentoria com {slot.mentora_nome}"
            f"{f' ({slot.mentora_cargo})' if slot.mentora_cargo else ''}.\n"
            f"Oferecida por {slot.company.nome} via Por ELAS finance."
        ),
        "start": {"dateTime": slot.inicio.isoformat(), "timeZone": tz},
        "end": {"dateTime": fim.isoformat(), "timeZone": tz},
        "attendees": convidados,
        "conferenceData": {
            "createRequest": {
                "requestId": f"porelas-{booking.pk}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    try:
        evento = (
            service.events()
            .insert(
                calendarId=settings.GOOGLE_CALENDAR_ID,
                body=corpo,
                conferenceDataVersion=1,
                sendUpdates="all",
            )
            .execute()
        )
        meet = evento.get("hangoutLink", "")
        return evento.get("id", ""), meet
    except Exception as exc:  # pragma: no cover
        logger.warning("Falha ao criar evento no Google Agenda: %s", exc)
        return "", ""


def cancelar_evento(event_id: str) -> None:
    if not event_id:
        return
    service = _service()
    if service is None:
        return
    try:
        service.events().delete(
            calendarId=settings.GOOGLE_CALENDAR_ID,
            eventId=event_id,
            sendUpdates="all",
        ).execute()
    except Exception as exc:  # pragma: no cover
        logger.warning("Falha ao cancelar evento no Google Agenda: %s", exc)
