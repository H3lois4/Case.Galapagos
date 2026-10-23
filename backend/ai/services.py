"""
Serviços de domínio — IA (Por ELAS finance).

Monta o histórico para o modelo, gera título e resumo (memória). O streaming em
si fica na view (precisa escrever na resposta SSE conforme os tokens chegam).
"""

from __future__ import annotations

from django.conf import settings

from .agents import Agente, montar_system
from .models import Conversation, Message
from .providers import ProviderError, get_provider


def historico_para_modelo(conversa: Conversation) -> list[dict]:
    """Últimas mensagens da conversa no formato do provedor."""
    limite = int(getattr(settings, "AI_MAX_HISTORY", 20))
    qs = conversa.mensagens.order_by("ordem")
    mensagens = list(qs)
    if limite and len(mensagens) > limite:
        mensagens = mensagens[-limite:]
    return [{"role": m.papel, "content": m.conteudo} for m in mensagens]


def titulo_a_partir(texto: str) -> str:
    """Gera um título curto a partir da primeira mensagem da usuária."""
    limpo = " ".join(texto.strip().split())
    return (limpo[:60] + "…") if len(limpo) > 60 else limpo


def gerar_resumo(conversa: Conversation) -> str:
    """Pede ao modelo um resumo curto da conversa (não-streaming).

    Falha de forma silenciosa (devolve o resumo atual) para não quebrar o fluxo.
    """
    mensagens = historico_para_modelo(conversa)
    if not mensagens:
        return conversa.resumo

    system = (
        "Resuma a conversa a seguir em no máximo 3 frases curtas, em português, "
        "destacando o objetivo da usuária e o que já foi combinado. Escreva só o "
        "resumo, sem rótulos."
    )
    try:
        provider = get_provider()
        pedacos = list(provider.chat(mensagens, system=system, stream=False))
        resumo = "".join(pedacos).strip()
        return resumo or conversa.resumo
    except ProviderError:
        return conversa.resumo


def construir_system(agente: Agente, conversa: Conversation) -> str:
    return montar_system(agente, profile=conversa.profile, resumo=conversa.resumo)
