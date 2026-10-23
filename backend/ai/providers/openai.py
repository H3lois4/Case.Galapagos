"""
Adaptador OpenAI — Por ELAS finance.

Alternativa ao Gemini, selecionada por `LLM_PROVIDER=openai`. Usa o SDK
`openai` (Chat Completions) com streaming. Import preguiçoso: o pacote só é
exigido quando este provedor é usado.
"""

from __future__ import annotations

from typing import Iterator

from django.conf import settings

from .base import ProviderError


class OpenAIProvider:
    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        if not settings.OPENAI_API_KEY:
            raise ProviderError("OPENAI_API_KEY não configurada.")
        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover
            raise ProviderError(
                "Pacote openai não instalado. Rode: pip install openai."
            ) from exc
        self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    @staticmethod
    def _to_messages(messages: list[dict], system: str) -> list[dict]:
        out = []
        if system:
            out.append({"role": "system", "content": system})
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
        payload = self._to_messages(messages, system)
        temperatura = kwargs.get("temperatura", 0.7)
        try:
            if stream:
                resposta = client.chat.completions.create(
                    model=model, messages=payload, temperature=temperatura, stream=True
                )
                for chunk in resposta:
                    delta = chunk.choices[0].delta
                    texto = getattr(delta, "content", None)
                    if texto:
                        yield texto
            else:
                resposta = client.chat.completions.create(
                    model=model, messages=payload, temperature=temperatura
                )
                texto = resposta.choices[0].message.content or ""
                if texto:
                    yield texto
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(f"Falha ao chamar a OpenAI: {exc}") from exc
