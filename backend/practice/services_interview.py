"""
Serviço de entrevista simulada — Por ELAS finance.

Cria a conversa (agente "entrevistadora") com o contexto da vaga embutido como
primeira mensagem, e gera o relatório estruturado (JSON de schema fixo) ao
encerrar, reusando o provedor de LLM da etapa 03.
"""

from __future__ import annotations

import json
import re

from django.utils import timezone

from ai.models import Conversation, Message
from ai.providers import ProviderError, get_provider

from .models import Interview

_CERCA_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _contexto_inicial(interview: Interview) -> str:
    """Mensagem de abertura (como se fosse a candidata iniciando)."""
    idioma = "em inglês" if interview.idioma == Interview.IDIOMA_EN else "em português"
    partes = [
        f"Vamos começar a entrevista {idioma}.",
        f"Vaga: {interview.vaga}.",
    ]
    if interview.papel_entrevistador:
        partes.append(f"Você é: {interview.papel_entrevistador}.")
    if interview.tipo:
        partes.append(f"Tipo de entrevista: {interview.tipo}.")
    if interview.nivel:
        partes.append(f"Nível: {interview.nivel}.")
    if interview.descricao:
        partes.append(f"Descrição da vaga: {interview.descricao}")
    partes.append(
        "Faça sua apresentação em uma frase e a primeira pergunta. "
        "Lembre-se: uma pergunta por vez e sem feedback durante a entrevista."
    )
    return "\n".join(partes)


def iniciar_entrevista(profile, dados: dict) -> Interview:
    interview = Interview.objects.create(
        profile=profile,
        vaga=(dados.get("vaga") or "").strip(),
        papel_entrevistador=(dados.get("papel_entrevistador") or "").strip(),
        tipo=(dados.get("tipo") or "").strip(),
        nivel=(dados.get("nivel") or "").strip(),
        idioma=dados.get("idioma") or Interview.IDIOMA_PT,
        descricao=(dados.get("descricao") or "").strip(),
    )
    conversa = Conversation.objects.create(
        profile=profile, agente="entrevistadora", titulo=f"Entrevista: {interview.vaga}"
    )
    # Mensagem de abertura da candidata, com o contexto da vaga.
    Message.objects.create(
        conversation=conversa,
        papel=Message.PAPEL_USER,
        conteudo=_contexto_inicial(interview),
        ordem=1,
    )
    interview.conversation = conversa
    interview.save(update_fields=["conversation"])
    return interview


SYSTEM_RELATORIO = """\
Você avalia uma entrevista simulada. Com base na conversa (perguntas da
entrevistadora e respostas da candidata), gere um relatório de feedback.

Responda SOMENTE com um JSON válido, sem texto antes ou depois, neste formato:
{
  "nota_geral": 0-10 (inteiro),
  "pontos_fortes": ["string", ...],
  "melhorias": ["string", ...],
  "por_pergunta": [
    {"pergunta": "string", "resumo_resposta": "string", "avaliacao": "string", "sugestao": "string"}
  ],
  "proximos_passos": ["string", ...]
}

Seja específico, construtivo e acolhedor. Escreva em português (ou no idioma da
entrevista). Não invente respostas que a candidata não deu.
"""


def _extrair_json(texto: str) -> dict:
    limpo = _CERCA_RE.sub("", texto.strip()).strip()
    if not limpo.startswith("{"):
        inicio, fim = limpo.find("{"), limpo.rfind("}")
        if inicio != -1 and fim != -1 and fim > inicio:
            limpo = limpo[inicio : fim + 1]
    return json.loads(limpo)


def gerar_relatorio(interview: Interview) -> dict:
    """Gera (e salva) o relatório estruturado. Lança ValueError se inválido."""
    conversa = interview.conversation
    if conversa is None:
        raise ValueError("Entrevista sem conversa associada.")

    mensagens = [
        {"role": m.papel, "content": m.conteudo}
        for m in conversa.mensagens.order_by("ordem")
    ]
    if len(mensagens) < 2:
        raise ValueError("A entrevista ainda não tem conversa suficiente.")

    try:
        provider = get_provider()
        pedacos = list(provider.chat(mensagens, system=SYSTEM_RELATORIO, stream=False))
    except ProviderError as exc:
        raise ValueError(str(exc)) from exc

    try:
        dados = _extrair_json("".join(pedacos))
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError("A IA não retornou um relatório válido. Tente de novo.") from exc

    # Normaliza o schema esperado.
    relatorio = {
        "nota_geral": _inteiro(dados.get("nota_geral"), 0, 10),
        "pontos_fortes": _lista_str(dados.get("pontos_fortes")),
        "melhorias": _lista_str(dados.get("melhorias")),
        "por_pergunta": _por_pergunta(dados.get("por_pergunta")),
        "proximos_passos": _lista_str(dados.get("proximos_passos")),
    }

    interview.relatorio = relatorio
    interview.nota_geral = relatorio["nota_geral"]
    interview.finalizado_em = timezone.now()
    interview.save(update_fields=["relatorio", "nota_geral", "finalizado_em"])
    return relatorio


def _inteiro(v, minimo, maximo) -> int:
    try:
        n = int(round(float(v)))
    except (TypeError, ValueError):
        n = 0
    return max(minimo, min(maximo, n))


def _lista_str(v) -> list[str]:
    if not isinstance(v, list):
        return []
    return [str(x).strip() for x in v if str(x).strip()]


def _por_pergunta(v) -> list[dict]:
    saida = []
    if not isinstance(v, list):
        return saida
    for item in v:
        if not isinstance(item, dict):
            continue
        saida.append(
            {
                "pergunta": str(item.get("pergunta", "")).strip(),
                "resumo_resposta": str(item.get("resumo_resposta", "")).strip(),
                "avaliacao": str(item.get("avaliacao", "")).strip(),
                "sugestao": str(item.get("sugestao", "")).strip(),
            }
        )
    return saida
