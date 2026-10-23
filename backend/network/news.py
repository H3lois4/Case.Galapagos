"""
IA de notícias — Por ELAS finance.

Lê feeds RSS do mercado, escolhe assuntos novos (dedupe por link) e pede ao LLM
para **reescrever** um resumo curto (palavras próprias, sem copiar), publicando
como posts do tipo notícia da conta oficial "Por ELAS".

Degrada com elegância: sem CRON_SECRET/GEMINI_API_KEY ou com feeds fora do ar,
não quebra — apenas não cria notícias.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import xml.etree.ElementTree as ET

import requests
from django.conf import settings

from ai.providers import ProviderError, get_provider

from .models import Post

logger = logging.getLogger(__name__)

CATEGORIAS = {"juros", "bolsa", "cambio", "cripto", "carreira", "economia"}

SYSTEM_NOTICIA = """\
Você escreve notícias curtas para um app de educação financeira para mulheres.
A partir do título e do resumo de uma notícia de mercado, reescreva COM SUAS
PRÓPRIAS PALAVRAS (não copie trechos) um resumo claro e acessível.

Responda SOMENTE com um JSON válido:
{"titulo": "string curta", "categoria": "juros|bolsa|cambio|cripto|carreira|economia", "resumo": "até 120 palavras, linguagem simples"}

Não invente dados que não estão na fonte. Tom informativo e acolhedor.
"""

_CERCA_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _feeds() -> list[str]:
    bruto = getattr(settings, "NEWS_FEEDS", "") or ""
    return [f.strip() for f in bruto.split(",") if f.strip()]


def _fonte_chave(link: str) -> str:
    return hashlib.sha256(link.strip().lower().encode("utf-8")).hexdigest()[:40]


def _ler_feed(url: str, limite: int) -> list[dict]:
    """Retorna itens {titulo, link, descricao} de um feed RSS."""
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "PorELAS/1.0"})
        resp.raise_for_status()
        raiz = ET.fromstring(resp.content)
    except Exception as exc:  # rede/parse
        logger.warning("Falha ao ler feed %s: %s", url, exc)
        return []

    itens = []
    for item in raiz.iter("item"):
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        descricao = (item.findtext("description") or "").strip()
        # remove tags HTML simples da descrição
        descricao = re.sub(r"<[^>]+>", "", descricao)
        if titulo and link:
            itens.append({"titulo": titulo, "link": link, "descricao": descricao})
        if len(itens) >= limite:
            break
    return itens


def _extrair_json(texto: str) -> dict:
    limpo = _CERCA_RE.sub("", texto.strip()).strip()
    if not limpo.startswith("{"):
        i, f = limpo.find("{"), limpo.rfind("}")
        if i != -1 and f != -1 and f > i:
            limpo = limpo[i : f + 1]
    return json.loads(limpo)


def _reescrever(item: dict) -> dict | None:
    prompt = f"Título: {item['titulo']}\nResumo: {item['descricao'][:800]}"
    try:
        provider = get_provider()
        pedacos = list(
            provider.chat(
                [{"role": "user", "content": prompt}],
                system=SYSTEM_NOTICIA,
                stream=False,
            )
        )
        dados = _extrair_json("".join(pedacos))
    except (ProviderError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Falha ao reescrever notícia: %s", exc)
        return None

    categoria = str(dados.get("categoria", "economia")).strip().lower()
    if categoria not in CATEGORIAS:
        categoria = "economia"
    return {
        "titulo": str(dados.get("titulo", item["titulo"])).strip()[:200],
        "categoria": categoria,
        "resumo": str(dados.get("resumo", "")).strip(),
    }


def rodar_noticias() -> int:
    """Gera notícias a partir dos feeds. Retorna quantas foram criadas."""
    if not getattr(settings, "GEMINI_API_KEY", "") and settings.LLM_PROVIDER == "gemini":
        logger.info("IA de notícias: LLM não configurado; nada a fazer.")
        return 0

    feeds = _feeds()
    if not feeds:
        logger.info("IA de notícias: sem NEWS_FEEDS configurados.")
        return 0

    max_run = int(getattr(settings, "NEWS_MAX_POR_RUN", 3))
    criadas = 0

    for url in feeds:
        if criadas >= max_run:
            break
        for item in _ler_feed(url, limite=10):
            if criadas >= max_run:
                break
            chave = _fonte_chave(item["link"])
            if Post.objects.filter(fonte_chave=chave).exists():
                continue
            reescrito = _reescrever(item)
            if not reescrito or not reescrito["resumo"]:
                continue
            Post.objects.create(
                tipo=Post.TIPO_NOTICIA,
                origem_ia=True,
                titulo=reescrito["titulo"],
                categoria=reescrito["categoria"],
                texto=reescrito["resumo"],
                fonte_url=item["link"],
                fonte_chave=chave,
            )
            criadas += 1

    return criadas
