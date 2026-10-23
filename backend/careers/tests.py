"""
Testes — carreira (Por ELAS finance).

O provedor de LLM é mockado para a geração do plano (sem rede). Cobrem:
seed idempotente, listagem/detalhe de áreas, geração de plano (JSON ok e
inválido→422), dono-only no plano e marcar passo.
"""

from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from accounts.authentication import ProfileUser
from accounts.models import Profile
from rest_framework.test import APIClient

from . import services
from .models import Area, CareerPlan


def _client(profile):
    client = APIClient()
    client.force_authenticate(user=ProfileUser(profile))
    return client


class FakeProvider:
    def __init__(self, texto):
        self.texto = texto

    def chat(self, messages, system, stream=True, **kw):
        yield self.texto


class SeedAreasTests(TestCase):
    def test_seed_idempotente(self):
        call_command("seed_areas")
        total = Area.objects.count()
        self.assertGreaterEqual(total, 10)
        # rodar de novo não duplica
        call_command("seed_areas")
        self.assertEqual(Area.objects.count(), total)

    def test_areas_tem_campos(self):
        call_command("seed_areas")
        ib = Area.objects.get(slug="investment-banking")
        self.assertTrue(ib.certificacoes)
        self.assertTrue(ib.mulheres)
        self.assertIn("linkedin", ib.mulheres[0])


class AreasAPITests(TestCase):
    def setUp(self):
        call_command("seed_areas")
        self.profile = Profile.objects.create(
            supabase_sub="a1", email="a@x.com", username="ana"
        )

    def test_lista_areas(self):
        resp = _client(self.profile).get("/api/carreira/areas/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 10)

    def test_detalhe_area(self):
        resp = _client(self.profile).get("/api/carreira/areas/quant/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["slug"], "quant")
        self.assertIn("hard_skills", resp.data)


class GerarPlanoTests(TestCase):
    def setUp(self):
        self.profile = Profile.objects.create(
            supabase_sub="g1", email="g@x.com", username="ger"
        )

    def test_gera_plano_json_valido(self):
        fake = FakeProvider(
            '```json\n{"titulo":"Plano","passos":['
            '{"titulo":"Estudar CPA-20","descricao":"base","prazo":"2 meses"},'
            '{"titulo":"Praticar","descricao":"exercícios","prazo":"1 mês"}'
            "]}\n```"
        )
        with mock.patch.object(services, "get_provider", return_value=fake):
            resp = _client(self.profile).post(
                "/api/carreira/plano/gerar/",
                {"contexto": "quero começar"}, format="json",
            )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["passos"]), 2)
        self.assertEqual(resp.data["passos"][0]["id"], 1)
        self.assertFalse(resp.data["passos"][0]["concluido"])

    def test_json_invalido_retorna_422(self):
        fake = FakeProvider("desculpe, não consigo gerar agora")
        with mock.patch.object(services, "get_provider", return_value=fake):
            resp = _client(self.profile).post(
                "/api/carreira/plano/gerar/",
                {"contexto": "x"}, format="json",
            )
        self.assertEqual(resp.status_code, 422)


class PlanoDonoTests(TestCase):
    def setUp(self):
        self.a = Profile.objects.create(supabase_sub="p1", email="a@x.com", username="a")
        self.b = Profile.objects.create(supabase_sub="p2", email="b@x.com", username="b")
        self.passos = [
            {"id": 1, "titulo": "P1", "descricao": "", "prazo": "1 mês", "concluido": False},
            {"id": 2, "titulo": "P2", "descricao": "", "prazo": "2 meses", "concluido": False},
        ]

    def test_salva_e_le_plano(self):
        c = _client(self.a)
        resp = c.put(
            "/api/carreira/plano/",
            {"titulo": "Meu plano", "passos": self.passos}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total_passos"], 2)

        get = c.get("/api/carreira/plano/")
        self.assertEqual(get.status_code, 200)
        self.assertEqual(get.data["titulo"], "Meu plano")

    def test_put_substitui_plano(self):
        c = _client(self.a)
        c.put("/api/carreira/plano/", {"titulo": "v1", "passos": self.passos}, format="json")
        c.put(
            "/api/carreira/plano/",
            {"titulo": "v2", "passos": self.passos[:1]}, format="json",
        )
        self.assertEqual(CareerPlan.objects.filter(profile=self.a).count(), 1)
        self.assertEqual(CareerPlan.objects.get(profile=self.a).titulo, "v2")

    def test_outra_usuaria_nao_ve_plano(self):
        _client(self.a).put(
            "/api/carreira/plano/", {"titulo": "x", "passos": self.passos}, format="json"
        )
        resp = _client(self.b).get("/api/carreira/plano/")
        self.assertEqual(resp.status_code, 404)

    def test_marcar_passo(self):
        c = _client(self.a)
        c.put("/api/carreira/plano/", {"titulo": "x", "passos": self.passos}, format="json")
        resp = c.patch("/api/carreira/plano/passo/1/", {"concluido": True}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["concluidos"], 1)

    def test_excluir_plano(self):
        c = _client(self.a)
        c.put("/api/carreira/plano/", {"titulo": "x", "passos": self.passos}, format="json")
        resp = c.delete("/api/carreira/plano/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(CareerPlan.objects.filter(profile=self.a).exists())
