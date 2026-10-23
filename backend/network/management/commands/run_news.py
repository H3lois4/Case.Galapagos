"""
Comando: roda a IA de notícias manualmente (para a demonstração).

Uso: python manage.py run_news
"""

from django.core.management.base import BaseCommand

from network.news import rodar_noticias


class Command(BaseCommand):
    help = "Gera notícias com a IA a partir dos feeds RSS configurados."

    def handle(self, *args, **options):
        criadas = rodar_noticias()
        self.stdout.write(self.style.SUCCESS(f"{criadas} notícia(s) criada(s)."))
