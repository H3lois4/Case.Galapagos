"""
Comando: popula dados iniciais — Por ELAS finance.

Cria a empresa Galapagos Capital (aprovada), uma vaga de exemplo e algumas
notícias da conta oficial "Por ELAS" (com imagem e link da fonte), para a Rede
já nascer com conteúdo. Não depende de serviços externos (R2, Gemini, Google).
Idempotente: rodar de novo não duplica.

As aulas, as mulheres de referência da Carreira e os demais posts são
adicionados pelo próprio app (pela conta administradora).

Uso:
    python manage.py seed_demo
    python manage.py seed_demo --limpar
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from accounts.models import Company
from network.models import Post

# Empresa real do app.
GALAPAGOS_SLUG = "galapagos-capital"

# Notícias iniciais da conta oficial "Por ELAS" (com imagem e fonte).
NOTICIAS = [
    {
        "titulo": "Banco Central mantém a taxa de juros",
        "categoria": "juros",
        "texto": (
            "O Copom decidiu manter a taxa básica de juros. Entenda, de forma "
            "simples, o que essa decisão significa para os seus investimentos "
            "de renda fixa e para o seu planejamento financeiro."
        ),
        "fonte_url": "https://www.bcb.gov.br/",
        "imagem_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=70",
    },
    {
        "titulo": "Bolsa fecha em alta puxada pelo setor financeiro",
        "categoria": "bolsa",
        "texto": (
            "O principal índice da bolsa brasileira subiu nesta sessão, com "
            "destaque para as ações de bancos. Veja o que movimentou o mercado "
            "e como acompanhar isso sem se perder nos termos técnicos."
        ),
        "fonte_url": "https://www.b3.com.br/",
        "imagem_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=70",
    },
    {
        "titulo": "Mulheres no mercado financeiro: a participação cresce",
        "categoria": "carreira",
        "texto": (
            "A presença de mulheres em áreas como research, gestão e banking "
            "vem aumentando. Conheça caminhos de entrada e certificações que "
            "ajudam a construir essa carreira."
        ),
        "fonte_url": "https://www.anbima.com.br/",
        "imagem_url": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=70",
    },
]


class Command(BaseCommand):
    help = "Popula dados iniciais (idempotente). Use --limpar para remover as notícias de exemplo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Remove as notícias de exemplo (não apaga a empresa nem dados reais).",
        )

    def handle(self, *args, **options):
        if options.get("limpar"):
            self._limpar()
            return

        call_command("seed_areas")
        call_command("seed_questions")

        galapagos = self._empresa()
        self._rede(galapagos)

        self.stdout.write(self.style.SUCCESS("Seed inicial concluído."))

    def _empresa(self) -> Company:
        company, _ = Company.objects.update_or_create(
            slug=GALAPAGOS_SLUG,
            defaults={
                "nome": "Galapagos Capital",
                "dominio": "galapagoscapital.com",
                "descricao": "Gestora e banco de investimentos.",
                "site": "https://galapagoscapital.com",
                "status": Company.STATUS_APROVADA,
            },
        )
        self.stdout.write(f"Empresa: {company.nome}")
        return company

    def _rede(self, galapagos: Company):
        # Vaga em nome da empresa.
        Post.objects.get_or_create(
            tipo=Post.TIPO_VAGA,
            vaga_cargo="Estágio em Research",
            company=galapagos,
            defaults={
                "company": galapagos,
                "tipo": Post.TIPO_VAGA,
                "vaga_cargo": "Estágio em Research",
                "vaga_local": "São Paulo (híbrido)",
                "vaga_link": "https://galapagoscapital.com/carreiras",
                "texto": "Vaga para estudantes de Economia, Administração ou Engenharia.",
            },
        )

        # Notícias da conta oficial "Por ELAS" (origem_ia), com imagem e fonte.
        for n in NOTICIAS:
            Post.objects.get_or_create(
                tipo=Post.TIPO_NOTICIA,
                origem_ia=True,
                titulo=n["titulo"],
                defaults={
                    "tipo": Post.TIPO_NOTICIA,
                    "origem_ia": True,
                    "titulo": n["titulo"],
                    "categoria": n["categoria"],
                    "texto": n["texto"],
                    "fonte_url": n["fonte_url"],
                    "imagem_url": n["imagem_url"],
                },
            )
        self.stdout.write(f"Posts: {Post.objects.count()} no total")

    def _limpar(self):
        titulos = [n["titulo"] for n in NOTICIAS]
        n_noticias = Post.objects.filter(
            tipo=Post.TIPO_NOTICIA, origem_ia=True, titulo__in=titulos
        ).delete()[0]
        self.stdout.write(
            self.style.SUCCESS(f"Removidas {n_noticias} notícia(s) de exemplo.")
        )
