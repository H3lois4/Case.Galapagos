"""
Provedores de LLM — Por ELAS finance.

Uma interface única (`LLMProvider.chat`) com implementações trocáveis por
variável de ambiente (`LLM_PROVIDER`). O resto do app (agentes, endpoints,
frontend) não conhece o provedor concreto.
"""

from .base import LLMProvider, ProviderError, get_provider, limpar_cache

__all__ = ["LLMProvider", "ProviderError", "get_provider", "limpar_cache"]
