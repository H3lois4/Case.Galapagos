"""
Rate limit da IA — Por ELAS finance.

Conta as mensagens da usuária (papel "user") na última hora direto no banco.
Sem dependência externa (Redis etc.), então funciona no runtime serverless.
"""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Message


def checar_limite(profile) -> tuple[bool, int]:
    """Retorna (permitido, retry_after_segundos).

    Permitido é False quando a usuária já atingiu o limite por hora. Nesse caso,
    retry_after indica em quantos segundos a mensagem mais antiga da janela sai.
    """
    limite = int(getattr(settings, "AI_RATE_LIMIT_PER_HOUR", 30))
    if limite <= 0:
        return True, 0

    agora = timezone.now()
    inicio = agora - timedelta(hours=1)
    recentes = (
        Message.objects.filter(
            conversation__profile=profile,
            papel=Message.PAPEL_USER,
            criado_em__gte=inicio,
        )
        .order_by("criado_em")
        .values_list("criado_em", flat=True)
    )
    total = len(recentes)
    if total < limite:
        return True, 0

    # Atingiu o limite: espera até a mensagem mais antiga completar 1h.
    mais_antiga = recentes[0]
    libera_em = mais_antiga + timedelta(hours=1)
    retry_after = max(1, int((libera_em - agora).total_seconds()))
    return False, retry_after
