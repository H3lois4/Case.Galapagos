"""
Serviços de carreira — geração do plano pela IA (Por ELAS finance).

Pede ao provedor de LLM um JSON estrito com os passos do plano. O modelo às
vezes embrulha o JSON em cercas de código (```json ... ```); limpamos isso
antes de parsear.
"""

from __future__ import annotations

import json
import re

from ai.providers import ProviderError, get_provider

SYSTEM_PLANO = """\
Você é uma planejadora de carreira do mercado financeiro. A partir do contexto
da usuária, gere um plano de carreira objetivo.

Responda SOMENTE com um JSON válido, sem texto antes ou depois, neste formato:
{
  "titulo": "string curta",
  "passos": [
    {"titulo": "string", "descricao": "string", "prazo": "ex.: 1 mês, 3 meses"}
  ]
}

Regras: 4 a 7 passos, em ordem lógica (do mais imediato ao mais avançado),
em português, concretos (estudo, certificação, prática, candidatura). Não inclua
recomendação de investimento. Não invente dados específicos de empresas.
"""

_CERCA_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _extrair_json(texto: str) -> dict:
    limpo = texto.strip()
    # remove cercas de código se vierem
    limpo = _CERCA_RE.sub("", limpo).strip()
    # tenta achar o primeiro objeto {...} se houver ruído em volta
    if not limpo.startswith("{"):
        inicio = limpo.find("{")
        fim = limpo.rfind("}")
        if inicio != -1 and fim != -1 and fim > inicio:
            limpo = limpo[inicio : fim + 1]
    return json.loads(limpo)


def gerar_plano(contexto: str) -> dict:
    """Gera um rascunho de plano. Lança ValueError se o JSON vier inválido.

    Retorna {"titulo": str, "passos": [{"id","titulo","descricao","prazo","concluido"}]}.
    """
    mensagens = [{"role": "user", "content": contexto.strip() or "Monte um plano inicial de carreira no mercado financeiro."}]
    try:
        provider = get_provider()
        pedacos = list(provider.chat(mensagens, system=SYSTEM_PLANO, stream=False))
    except ProviderError as exc:
        raise ValueError(str(exc)) from exc

    bruto = "".join(pedacos)
    try:
        dados = _extrair_json(bruto)
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError("A IA não retornou um plano válido. Tente de novo.") from exc

    passos_raw = dados.get("passos") or []
    if not isinstance(passos_raw, list) or not passos_raw:
        raise ValueError("A IA não retornou passos para o plano.")

    passos = []
    for i, p in enumerate(passos_raw, start=1):
        if not isinstance(p, dict):
            continue
        passos.append(
            {
                "id": i,
                "titulo": str(p.get("titulo", "")).strip() or f"Passo {i}",
                "descricao": str(p.get("descricao", "")).strip(),
                "prazo": str(p.get("prazo", "")).strip(),
                "concluido": False,
            }
        )
    if not passos:
        raise ValueError("A IA não retornou passos válidos.")

    return {"titulo": str(dados.get("titulo", "")).strip() or "Meu plano de carreira", "passos": passos}


def normalizar_passos(passos) -> list[dict]:
    """Normaliza passos recebidos do cliente ao salvar o plano (PUT)."""
    saida = []
    if not isinstance(passos, list):
        return saida
    for i, p in enumerate(passos, start=1):
        if not isinstance(p, dict):
            continue
        saida.append(
            {
                "id": int(p.get("id", i)),
                "titulo": str(p.get("titulo", "")).strip() or f"Passo {i}",
                "descricao": str(p.get("descricao", "")).strip(),
                "prazo": str(p.get("prazo", "")).strip(),
                "concluido": bool(p.get("concluido", False)),
            }
        )
    return saida
