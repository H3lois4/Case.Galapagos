"""
Comando: popula/atualiza o banco de questões dos simulados a partir do seed.

Idempotente — upsert por `chave`. Edite o JSON e rode de novo para
atualizar/adicionar questões.

Uso: python manage.py seed_questions
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from practice.models import Question
from practice.temas import TEMAS_SLUGS

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "questions.json"


class Command(BaseCommand):
    help = "Popula/atualiza as questões dos simulados (upsert por chave)."

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f"Seed não encontrado: {DATA_FILE}"))
            return

        dados = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        criados = atualizados = ignorados = 0

        for item in dados:
            tema = item.get("tema")
            if tema not in TEMAS_SLUGS:
                self.stderr.write(
                    self.style.WARNING(f"Tema inválido em {item.get('chave')}: {tema}")
                )
                ignorados += 1
                continue
            alternativas = item.get("alternativas", [])
            correta = item.get("correta", 0)
            if not (0 <= correta < len(alternativas)):
                self.stderr.write(
                    self.style.WARNING(
                        f"Índice 'correta' fora do intervalo em {item.get('chave')}"
                    )
                )
                ignorados += 1
                continue

            _, criado = Question.objects.update_or_create(
                chave=item["chave"],
                defaults={
                    "tema": tema,
                    "enunciado": item.get("enunciado", ""),
                    "alternativas": alternativas,
                    "correta": correta,
                    "explicacao": item.get("explicacao", ""),
                    "ativo": item.get("ativo", True),
                },
            )
            criados += 1 if criado else 0
            atualizados += 0 if criado else 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Questões: {criados} criada(s), {atualizados} atualizada(s), "
                f"{ignorados} ignorada(s)."
            )
        )
