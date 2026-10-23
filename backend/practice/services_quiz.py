"""
Serviço de simulados — Por ELAS finance.

O gabarito nunca sai antes do envio: `iniciar` devolve as questões públicas
(sem `correta`/`explicacao`) e `corrigir` compara as respostas com o banco no
servidor.
"""

from __future__ import annotations

import random

from django.utils import timezone

from .models import Question, QuizAttempt
from .temas import TEMAS_SLUGS

TAMANHO_SIMULADO = 10


class TemaInvalido(Exception):
    pass


class SemQuestoes(Exception):
    pass


def iniciar(profile, tema: str) -> tuple[QuizAttempt, list[dict]]:
    if tema not in TEMAS_SLUGS:
        raise TemaInvalido("Tema inválido.")

    questoes = list(Question.objects.filter(tema=tema, ativo=True))
    if not questoes:
        raise SemQuestoes("Ainda não há questões para este tema.")

    random.shuffle(questoes)
    selecionadas = questoes[:TAMANHO_SIMULADO]

    attempt = QuizAttempt.objects.create(
        profile=profile,
        tema=tema,
        questao_ids=[q.id for q in selecionadas],
        total=len(selecionadas),
    )
    publicas = [_questao_publica(q) for q in selecionadas]
    return attempt, publicas


def corrigir(attempt: QuizAttempt, respostas: dict) -> dict:
    """Corrige no servidor. `respostas` = {"<questao_id>": indice}."""
    if attempt.finalizado:
        raise ValueError("Este simulado já foi finalizado.")

    questoes = {q.id: q for q in Question.objects.filter(id__in=attempt.questao_ids)}
    revisao = []
    acertos = 0
    normalizadas = {}

    for qid in attempt.questao_ids:
        q = questoes.get(qid)
        if not q:
            continue
        escolhida = respostas.get(str(qid), respostas.get(qid))
        try:
            escolhida = int(escolhida)
        except (TypeError, ValueError):
            escolhida = None
        acertou = escolhida == q.correta
        if acertou:
            acertos += 1
        normalizadas[str(qid)] = escolhida
        revisao.append(
            {
                "id": q.id,
                "enunciado": q.enunciado,
                "alternativas": q.alternativas,
                "escolhida": escolhida,
                "correta": q.correta,
                "acertou": acertou,
                "explicacao": q.explicacao,
            }
        )

    attempt.respostas = normalizadas
    attempt.nota = acertos
    attempt.finalizado = True
    attempt.finalizado_em = timezone.now()
    attempt.save(update_fields=["respostas", "nota", "finalizado", "finalizado_em"])

    return {
        "attempt_id": attempt.id,
        "tema": attempt.tema,
        "nota": acertos,
        "total": attempt.total,
        "revisao": revisao,
    }


def _questao_publica(q: Question) -> dict:
    """Payload sem gabarito nem explicação."""
    return {
        "id": q.id,
        "enunciado": q.enunciado,
        "alternativas": q.alternativas,
    }
