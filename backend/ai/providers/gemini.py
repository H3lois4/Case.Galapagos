"""
Adaptador Gemini (Google) — Por ELAS finance.

Usa o SDK `google-genai`. O streaming vem de `generate_content_stream`, e cada
pedaço traz `.text`. A instrução de sistema vai em `system_instruction`.
O papel "assistant" do nosso formato vira "model" no Gemini.
"""

from __future__ import annotations

from typing import Iterator

from django.conf import settings

from .base import ProviderError


class GeminiProvider:
    def __init__(self) -> None:
        self._client = None  # criado preguiçosamente no primeiro uso

    def _get_client(self):
        if self._client is not None:
            return self._client
        if not settings.GEMINI_API_KEY:
            raise ProviderError(
                "GEMINI_API_KEY não configurada. Defina a chave no ambiente."
            )
        try:
            from google import genai
        except ImportError as exc:  # pragma: no cover
            raise ProviderError(
                "Pacote google-genai não instalado. Rode: pip install google-genai."
            ) from exc
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    @staticmethod
    def _to_contents(messages: list[dict]) -> list[dict]:
        """Converte nosso formato para o `contents` do Gemini."""
        contents = []
        for m in messages:
            papel = "model" if m.get("role") == "assistant" else "user"
            contents.append({"role": papel, "parts": [{"text": m.get("content", "")}]})
        return contents

    def chat(
        self,
        messages: list[dict],
        system: str,
        stream: bool = True,
        **kwargs,
    ) -> Iterator[str]:
        client = self._get_client()
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system or None,
            temperature=kwargs.get("temperatura", 0.7),
        )
        model = kwargs.get("model") or settings.LLM_MODEL
        contents = self._to_contents(messages)

        try:
            if stream:
                resposta = client.models.generate_content_stream(
                    model=model, contents=contents, config=config
                )
                for chunk in resposta:
                    texto = getattr(chunk, "text", None)
                    if texto:
                        yield texto
            else:
                resposta = client.models.generate_content(
                    model=model, contents=contents, config=config
                )
                texto = getattr(resposta, "text", "") or ""
                if texto:
                    yield texto
        except ProviderError:
            raise
        except Exception as exc:  # erros de rede/API do SDK
            raise ProviderError(f"Falha ao chamar o Gemini: {exc}") from exc
