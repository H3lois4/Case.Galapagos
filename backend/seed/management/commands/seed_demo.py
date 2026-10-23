"""
Comando: popula dados de demonstração — Por ELAS finance.

Cria dados coerentes para a banca testar todas as telas sem depender de
serviços externos (R2, Gemini, Google). Idempotente: rodar de novo não
duplica. `--limpar` remove apenas os dados de demo (perfis/empresas com
marcadores `demo-`), preservando dados reais.

Uso:
    python manage.py seed_demo
    python manage.py seed_demo --limpar
"""

from datetime import timedelta

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Company, Profile
from careers.models import CareerPlan
from lessons.models import Lesson
from mentorship.models import MentorshipSlot
from network.models import Post

# Marcadores de demo (prefixos estáveis).
DEMO_SUB_PREFIX = "demo-"
DEMO_SLUGS = ["demo-galapagos", "demo-azul-capital"]

# Vídeo público de teste (não depende do R2).
VIDEO_DEMO = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"


EMPRESAS = [
    {
        "slug": "demo-galapagos",
        "nome": "Galapagos Capital (demo)",
        "dominio": "galapagoscapital.com",
        "descricao": "Gestora e banco de investimentos — conta de demonstração.",
        "site": "https://galapagoscapital.com",
    },
    {
        "slug": "demo-azul-capital",
        "nome": "Azul Capital (demo)",
        "dominio": "azulcapital.demo",
        "descricao": "Casa de análise e investimentos — conta de demonstração.",
        "site": "https://example.com",
    },
]

PERFIS = [
    {"sub": "demo-ana", "username": "ana.demo", "nome": "Ana (demo)", "tipo": "pessoal",
     "descricao": "Em transição para o mercado financeiro."},
    {"sub": "demo-bia", "username": "bia.demo", "nome": "Bia (demo)", "tipo": "pessoal",
     "descricao": "Estudando para a CPA-20."},
    {"sub": "demo-galapagos-rh", "username": "galapagos.rh", "nome": "RH Galapagos (demo)",
     "tipo": "empresa", "empresa": "demo-galapagos"},
    {"sub": "demo-azul-rh", "username": "azul.rh", "nome": "RH Azul (demo)",
     "tipo": "empresa", "empresa": "demo-azul-capital"},
]


class Command(BaseCommand):
    help = "Popula dados de demonstração (idempotente). Use --limpar para remover."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limpar", action="store_true", help="Remove os dados de demonstração."
        )

    def handle(self, *args, **options):
        if options.get("limpar"):
            self._limpar()
            return

        call_command("seed_areas")
        call_command("seed_questions")

        empresas = self._empresas()
        perfis = self._perfis(empresas)
        self._aulas(empresas, perfis)
        self._mentoria(empresas, perfis)
        self._rede(empresas, perfis)
        self._plano(perfis)

        self.stdout.write(self.style.SUCCESS("Seed de demonstração concluído."))

    # ------------------------------------------------------------------ demo
    def _empresas(self) -> dict[str, Company]:
        out = {}
        for e in EMPRESAS:
            company, _ = Company.objects.update_or_create(
                slug=e["slug"],
                defaults={
                    "nome": e["nome"],
                    "dominio": e["dominio"],
                    "descricao": e["descricao"],
                    "site": e["site"],
                    "status": Company.STATUS_APROVADA,
                },
            )
            out[e["slug"]] = company
        self.stdout.write(f"Empresas: {len(out)}")
        return out

    def _perfis(self, empresas: dict[str, Company]) -> dict[str, Profile]:
        out = {}
        for p in PERFIS:
            company = empresas.get(p.get("empresa")) if p.get("empresa") else None
            profile, _ = Profile.objects.update_or_create(
                supabase_sub=p["sub"],
                defaults={
                    "email": f"{p['username']}@porelas.demo",
                    "username": p["username"],
                    "account_type": (
                        Profile.TIPO_EMPRESA if p["tipo"] == "empresa" else Profile.TIPO_PESSOAL
                    ),
                    "company": company,
                    "nome_exibicao": p["nome"],
                    "descricao": p.get("descricao", ""),
                },
            )
            out[p["sub"]] = profile
        self.stdout.write(f"Perfis: {len(out)}")
        return out

    def _aula(self, **kw):
        """get_or_create por (titulo, origem, company) para não duplicar."""
        chave = {
            "titulo": kw["titulo"],
            "origem": kw["origem"],
            "company": kw.get("company"),
        }
        Lesson.objects.get_or_create(defaults=kw, **chave)

    def _aulas(self, empresas, perfis):
        galap = empresas["demo-galapagos"]
        azul = empresas["demo-azul-capital"]
        rh_g = perfis["demo-galapagos-rh"]
        rh_a = perfis["demo-azul-rh"]
        dados = [
            dict(company=galap, autor=rh_g, origem=Lesson.ORIGEM_EMPRESA,
                 titulo="Como funciona um banco de investimentos",
                 descricao="Visão geral das áreas e do dia a dia.",
                 video_url=VIDEO_DEMO, duracao_seg=10),
            dict(company=galap, autor=rh_g, origem=Lesson.ORIGEM_EMPRESA,
                 titulo="Carreira em M&A: por onde começar",
                 descricao="Dicas de quem atua na área.",
                 video_url=VIDEO_DEMO, duracao_seg=10),
            dict(company=azul, autor=rh_a, origem=Lesson.ORIGEM_EMPRESA,
                 titulo="Análise de empresas na prática",
                 descricao="Primeiros passos em research.",
                 video_url=VIDEO_DEMO, duracao_seg=10),
            dict(company=None, autor=None, origem=Lesson.ORIGEM_IA,
                 titulo="O que é o mercado financeiro",
                 descricao="Fundamentos para começar do zero.",
                 video_url=VIDEO_DEMO, duracao_seg=10),
            dict(company=None, autor=None, origem=Lesson.ORIGEM_IA,
                 titulo="Renda fixa x renda variável",
                 descricao="As diferenças explicadas de forma simples.",
                 video_url=VIDEO_DEMO, duracao_seg=10),
        ]
        for d in dados:
            self._aula(**d)
        self.stdout.write(f"Aulas: {Lesson.objects.count()} no total")

    def _mentoria(self, empresas, perfis):
        agora = timezone.now()
        dados = [
            dict(company=empresas["demo-galapagos"], criado_por=perfis["demo-galapagos-rh"],
                 mentora_nome="Carla Mentora", mentora_cargo="Diretora de M&A",
                 mentora_email="carla@galapagoscapital.com",
                 tema="Carreira em Investment Banking", inicio=agora + timedelta(days=7)),
            dict(company=empresas["demo-azul-capital"], criado_por=perfis["demo-azul-rh"],
                 mentora_nome="Duda Mentora", mentora_cargo="Head de Research",
                 mentora_email="duda@azulcapital.demo",
                 tema="Primeiros passos em Research", inicio=agora + timedelta(days=14)),
        ]
        for d in dados:
            MentorshipSlot.objects.get_or_create(
                company=d["company"], tema=d["tema"], defaults=d
            )
        self.stdout.write(f"Horários de mentoria: {MentorshipSlot.objects.count()} no total")

    def _post(self, chave: dict, defaults: dict):
        Post.objects.get_or_create(defaults=defaults, **chave)

    def _rede(self, empresas, perfis):
        ana = perfis["demo-ana"]
        galap = empresas["demo-galapagos"]
        rh_g = perfis["demo-galapagos-rh"]

        # Post comum
        self._post(
            {"autor": ana, "tipo": Post.TIPO_POST, "texto": "Comecei meus estudos para a CPA-20! 📚"},
            {"autor": ana, "tipo": Post.TIPO_POST, "texto": "Comecei meus estudos para a CPA-20! 📚"},
        )
        # Vaga (empresa)
        self._post(
            {"tipo": Post.TIPO_VAGA, "vaga_cargo": "Estágio em Research", "company": galap},
            {
                "autor": rh_g, "company": galap, "tipo": Post.TIPO_VAGA,
                "vaga_cargo": "Estágio em Research", "vaga_local": "São Paulo (híbrido)",
                "vaga_link": "https://example.com/vaga", "texto": "Vaga para estudantes de Economia/Administração.",
            },
        )
        # Notícias da IA (texto fixo, sem depender do LLM)
        noticias = [
            ("Banco Central mantém a taxa de juros", "juros",
             "O Copom decidiu manter a taxa básica. Entenda o que isso significa para seus investimentos de renda fixa."),
            ("Bolsa fecha em alta puxada por bancos", "bolsa",
             "O principal índice da bolsa subiu hoje, com destaque para o setor financeiro."),
        ]
        for titulo, categoria, resumo in noticias:
            self._post(
                {"tipo": Post.TIPO_NOTICIA, "origem_ia": True, "titulo": titulo},
                {"tipo": Post.TIPO_NOTICIA, "origem_ia": True, "titulo": titulo,
                 "categoria": categoria, "texto": resumo},
            )
        self.stdout.write(f"Posts: {Post.objects.count()} no total")

    def _plano(self, perfis):
        ana = perfis["demo-ana"]
        CareerPlan.objects.update_or_create(
            profile=ana,
            defaults={
                "titulo": "Plano de entrada no mercado financeiro",
                "passos": [
                    {"id": 1, "titulo": "Concluir a CPA-20", "descricao": "Estudar e fazer a prova.",
                     "prazo": "3 meses", "concluido": False},
                    {"id": 2, "titulo": "Montar um portfólio de estudos", "descricao": "Projetos no LinkedIn.",
                     "prazo": "2 meses", "concluido": False},
                    {"id": 3, "titulo": "Candidatar-se a estágios", "descricao": "Aplicar em vagas de research.",
                     "prazo": "contínuo", "concluido": False},
                ],
            },
        )
        self.stdout.write("Plano de carreira de exemplo: ok")

    # ---------------------------------------------------------------- limpar
    def _limpar(self):
        # Apagar os perfis e empresas de demo remove em cascata aulas, posts,
        # mentorias e planos ligados a eles.
        perfis = Profile.objects.filter(supabase_sub__startswith=DEMO_SUB_PREFIX)
        n_perfis = perfis.count()
        perfis.delete()

        empresas = Company.objects.filter(slug__in=DEMO_SLUGS)
        n_emp = empresas.count()
        empresas.delete()

        # Notícias da IA de demo (não têm perfil/empresa) — removidas pelos títulos fixos.
        titulos_demo = [
            "Banco Central mantém a taxa de juros",
            "Bolsa fecha em alta puxada por bancos",
        ]
        n_noticias = Post.objects.filter(
            tipo=Post.TIPO_NOTICIA, origem_ia=True, titulo__in=titulos_demo
        ).delete()[0]

        self.stdout.write(
            self.style.SUCCESS(
                f"Removidos: {n_perfis} perfil(is), {n_emp} empresa(s), "
                f"{n_noticias} notícia(s) de demo."
            )
        )
