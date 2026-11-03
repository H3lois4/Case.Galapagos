"""
Comando: limpeza dos dados de exemplo antigos — Por ELAS finance.

Remove o que sobrou de seeds anteriores (empresa Azul, a Galapagos antiga com
"(demo)" no nome, perfis de demonstração, aulas de exemplo e posts de
demonstração), deixando o banco pronto para os dados reais.

É SEGURO para rodar em produção: não toca em usuárias reais (identificadas por
`supabase_sub` que NÃO começa com "demo-") nem na empresa Galapagos atual
(slug `galapagos-capital`).

Uso (local):
    python manage.py limpar_dados
    python manage.py limpar_dados --dry-run   # só mostra o que removeria

Uso (produção), com o DATABASE_URL de produção no ambiente:
    DATABASE_URL="postgres://..." python manage.py limpar_dados
"""

from django.core.management.base import BaseCommand
from django.db.models import Q

from accounts.models import Company, Profile
from lessons.models import Lesson
from network.models import Post

# Slugs de empresas antigas de demonstração (NÃO inclui galapagos-capital).
EMPRESAS_DEMO = ["demo-galapagos", "demo-azul-capital", "demo-azul"]

# Textos/títulos de posts de demonstração a remover.
POSTS_DEMO_TEXTO = [
    "Comecei meus estudos para a CPA-20! 📚",
    "Comecei meus estudos para a CPA-20!",
]
NOTICIAS_DEMO_ANTIGAS = [
    "Bolsa fecha em alta puxada por bancos",  # versão antiga, sem imagem
    "Banco Central mantém a taxa de juros",   # versão antiga, sem imagem/fonte
]


class Command(BaseCommand):
    help = "Remove dados de exemplo antigos (Azul, demos, aulas de exemplo)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Apenas lista o que seria removido, sem apagar.",
        )

    def handle(self, *args, **options):
        dry = options.get("dry_run", False)
        prefixo = "[dry-run] " if dry else ""

        # 1. Perfis de demonstração (supabase_sub começa com "demo-").
        perfis = Profile.objects.filter(supabase_sub__startswith="demo-")
        self.stdout.write(
            f"{prefixo}Perfis demo: {perfis.count()} "
            f"({list(perfis.values_list('username', flat=True))})"
        )

        # 2. Empresas antigas de demonstração.
        empresas = Company.objects.filter(
            Q(slug__in=EMPRESAS_DEMO) | Q(nome__icontains="(demo)")
        )
        self.stdout.write(
            f"{prefixo}Empresas demo: {empresas.count()} "
            f"({list(empresas.values_list('slug', flat=True))})"
        )

        # 3. Aulas de exemplo (vídeo de teste do Big Buck Bunny).
        aulas = Lesson.objects.filter(video_url__icontains="test-videos.co.uk")
        self.stdout.write(f"{prefixo}Aulas de exemplo: {aulas.count()}")

        # 4. Posts de demonstração (por texto) e notícias antigas sem imagem.
        posts_demo = Post.objects.filter(
            Q(texto__in=POSTS_DEMO_TEXTO)
            | Q(tipo=Post.TIPO_NOTICIA, titulo__in=NOTICIAS_DEMO_ANTIGAS, imagem_url="")
        )
        self.stdout.write(f"{prefixo}Posts de exemplo: {posts_demo.count()}")

        if dry:
            self.stdout.write(self.style.WARNING("Nada foi removido (dry-run)."))
            return

        # Executa a remoção. Apagar perfis/empresas remove em cascata o que
        # estiver ligado a eles (aulas, posts, mentorias).
        posts_demo.delete()
        aulas.delete()
        perfis.delete()
        empresas.delete()

        self.stdout.write(self.style.SUCCESS("Limpeza concluída."))
