"""
Adaptador Anthropic (Claude) — Por ELAS finance.

Alternativa ao Gemini, selecionada por `LLM_PROVIDER=anthropic`. Usa o SDK
`anthropic` (Messages) com streaming. Import preguiçoso.
"""

from __future__ import annotations

from typing import Iterator

from django.conf import settings

from .base import ProviderError


class AnthropicProvider:
    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        if not settings.ANTHROPIC_API_KEY:
            raise ProviderError("ANTHROPIC_API_KEY não configurada.")
        try:
            import anthropic
        except ImportError as exc:  # pragma: no cover
            raise ProviderError(
                "Pacote anthropic não instalado. Rode: pip install anthropic."
            ) from exc
        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    @staticmethod
    def _to_messages(messages: list[dict]) -> list[dict]:
        out = []
        for m in messages:
            papel = "assistant" if m.get("role") == "assistant" else "user"
            out.append({"role": papel, "content": m.get("content", "")})
        return out

    def chat(
        self,
        messages: list[dict],
        system: str,
        stream: bool = True,
        **kwargs,
    ) -> Iterator[str]:
        client = self._get_client()
        model = kwargs.get("model") or settings.LLM_MODEL
        payload = self._to_messages(messages)
        temperatura = kwargs.get("temperatura", 0.7)
        max_tokens = kwargs.get("max_tokens", 2048)
        try:
            if stream:
                with client.messages.stream(
                    model=model,
                    system=system or None,
                    messages=payload,
                    temperature=temperatura,
                    max_tokens=max_tokens,
                ) as fluxo:
                    for texto in fluxo.text_stream:
                        if texto:
                            yield texto
            else:
                resp = client.messages.create(
                    model=model,
                    system=system or None,
                    messages=payload,
                    temperature=temperatura,
                    max_tokens=max_tokens,
                )
                texto = "".join(
                    bloco.text for bloco in resp.content if getattr(bloco, "text", None)
                )
                if texto:
                    yield texto
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(f"Falha ao chamar a Anthropic: {exc}") from exc
