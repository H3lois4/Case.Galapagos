"""
Comando: popula/atualiza as áreas do mercado financeiro a partir do seed.

Idempotente — faz upsert por `slug`, então rodar de novo apenas atualiza o
conteúdo (não duplica e não apaga planos de carreira).

Uso: python manage.py seed_areas
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from careers.models import Area

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "areas.json"


class Command(BaseCommand):
    help = "Popula/atualiza as áreas do mercado financeiro (upsert por slug)."

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f"Seed não encontrado: {DATA_FILE}"))
            return

        dados = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        criados = atualizados = 0

        for item in dados:
            slug = item["slug"]
            defaults = {
                "nome": item.get("nome", ""),
                "resumo": item.get("resumo", ""),
                "descricao": item.get("descricao", ""),
                "formacao": item.get("formacao", ""),
                "certificacoes": item.get("certificacoes", []),
                "hard_skills": item.get("hard_skills", []),
                "soft_skills": item.get("soft_skills", []),
                "cargos_entrada": item.get("cargos_entrada", []),
                "mulheres": item.get("mulheres", []),
                "ordem": item.get("ordem", 0),
            }
            _, criado = Area.objects.update_or_create(slug=slug, defaults=defaults)
            if criado:
                criados += 1
            else:
                atualizados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Áreas: {criados} criada(s), {atualizados} atualizada(s)."
            )
        )
