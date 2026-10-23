"""
Interface e fábrica de provedores de LLM — Por ELAS finance.

A interface é mínima de propósito: `chat(messages, system, stream)` devolve um
iterador de pedaços de texto (tokens). Isso permite streaming uniforme,
independente do provedor concreto (Gemini, OpenAI, Anthropic).
"""

from __future__ import annotations

from typing import Iterator, Protocol, runtime_checkable

from django.conf import settings


class ProviderError(RuntimeError):
    """Falha ao falar com o provedor de LLM (sem chave, erro de API, etc.)."""


@runtime_checkable
class LLMProvider(Protocol):
    """Contrato que todo provedor deve cumprir."""

    def chat(
        self,
        messages: list[dict],
        system: str,
        stream: bool = True,
        **kwargs,
    ) -> Iterator[str]:
        """Gera a resposta do modelo.

        `messages`: histórico no formato [{"role": "user"|"assistant", "content": str}].
        `system`: instrução de sistema (persona + regras + conhecimento + contexto).
        `stream`: quando True, emite pedaços conforme o modelo gera; quando False,
        emite um único pedaço com o texto completo.
        Retorna um iterador de strings (os pedaços de texto).
        """
        ...


# Cache do provedor por processo (serverless: por instância).
_CACHE: dict[str, LLMProvider] = {}


def get_provider(nome: str | None = None) -> LLMProvider:
    """Fábrica: devolve o provedor configurado por `LLM_PROVIDER`.

    Import preguiçoso para não exigir SDKs de provedores não usados.
    """
    nome = (nome or getattr(settings, "LLM_PROVIDER", "gemini")).lower().strip()
    if nome in _CACHE:
        return _CACHE[nome]

    if nome == "gemini":
        from .gemini import GeminiProvider

        provider: LLMProvider = GeminiProvider()
    elif nome == "openai":
        from .openai import OpenAIProvider

        provider = OpenAIProvider()
    elif nome == "anthropic":
        from .anthropic import AnthropicProvider

        provider = AnthropicProvider()
    else:
        raise ProviderError(
            f"LLM_PROVIDER desconhecido: {nome!r}. Use gemini, openai ou anthropic."
        )

    _CACHE[nome] = provider
    return provider


def limpar_cache() -> None:
    """Zera o cache (útil em testes que trocam o provedor por env)."""
    _CACHE.clear()
