"""
Testes — mentoria (Por ELAS finance).

O Google Agenda fica desligado (sem GOOGLE_* nos settings de teste → no-op) e o
e-mail usa o backend em memória. Cobrem: cadastro só por empresa aprovada,
listagem de disponíveis, agendamento atômico (2ª reserva falha), limite mensal,
cancelamento (libera slot + janela de 24 h) e dono-only.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.authentication import ProfileUser
from accounts.models import Company, Profile

from .models import Booking, MentorshipSlot
from .services import (
    ForaDaJanela,
    Indisponivel,
    LimiteMensal,
    agendar,
    cancelar,
)


def _client(profile):
    client = APIClient()
    client.force_authenticate(user=ProfileUser(profile))
    return client


def _slot(company, profile, dias=3, **kw):
    defaults = dict(
        company=company,
        criado_por=profile,
        mentora_nome="Mentora",
        mentora_email="mentora@empresa.com",
        tema="Carreira em IB",
        inicio=timezone.now() + timedelta(days=dias),
        duracao_min=45,
    )
    defaults.update(kw)
    return MentorshipSlot.objects.create(**defaults)


class CadastroSlotTests(TestCase):
    def setUp(self):
        self.aprovada = Company.objects.create(
            nome="Galapagos", slug="galapagos", status=Company.STATUS_APROVADA
        )
        self.empresa = Profile.objects.create(
            supabase_sub="e1", email="e@x.com", username="empresa",
            account_type=Profile.TIPO_EMPRESA, company=self.aprovada,
        )
        self.pessoal = Profile.objects.create(
            supabase_sub="u1", email="u@x.com", username="pessoal"
        )

    def test_empresa_aprovada_cadastra(self):
        resp = _client(self.empresa).post(
            "/api/mentoria/horarios/",
            {
                "mentora_nome": "Ana",
                "mentora_email": "ana@empresa.com",
                "tema": "Primeiros passos",
                "inicio": (timezone.now() + timedelta(days=2)).isoformat(),
                "duracao_min": 30,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(MentorshipSlot.objects.count(), 1)

    def test_pessoal_nao_cadastra(self):
        resp = _client(self.pessoal).post(
            "/api/mentoria/horarios/",
            {"mentora_nome": "Ana", "mentora_email": "a@e.com", "tema": "x",
             "inicio": (timezone.now() + timedelta(days=2)).isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_nao_cadastra_no_passado(self):
        resp = _client(self.empresa).post(
            "/api/mentoria/horarios/",
            {"mentora_nome": "Ana", "mentora_email": "a@e.com", "tema": "x",
             "inicio": (timezone.now() - timedelta(days=1)).isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


class ListagemTests(TestCase):
    def setUp(self):
        self.empresa_c = Company.objects.create(
            nome="C", slug="c", status=Company.STATUS_APROVADA
        )
        self.empresa = Profile.objects.create(
            supabase_sub="e2", email="e@x.com", username="emp",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_c,
        )
        self.viewer = Profile.objects.create(
            supabase_sub="v1", email="v@x.com", username="v"
        )
        self.livre = _slot(self.empresa_c, self.empresa)
        self.ocupado = _slot(self.empresa_c, self.empresa, dias=4, reservado=True)

    def test_lista_so_disponiveis(self):
        resp = _client(self.viewer).get("/api/mentoria/horarios/")
        ids = [s["id"] for s in resp.data]
        self.assertIn(self.livre.id, ids)
        self.assertNotIn(self.ocupado.id, ids)


class AgendamentoAtomicoTests(TestCase):
    def setUp(self):
        self.empresa_c = Company.objects.create(
            nome="C", slug="c", status=Company.STATUS_APROVADA
        )
        self.criador = Profile.objects.create(
            supabase_sub="e3", email="e@x.com", username="emp",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_c,
        )
        self.ana = Profile.objects.create(supabase_sub="a", email="a@x.com", username="ana")
        self.bia = Profile.objects.create(supabase_sub="b", email="b@x.com", username="bia")
        self.slot = _slot(self.empresa_c, self.criador)

    def test_primeira_leva_segunda_falha(self):
        agendar(self.ana, self.slot.id)
        with self.assertRaises(Indisponivel):
            agendar(self.bia, self.slot.id)
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.reservado)
        self.assertEqual(Booking.objects.filter(status="ativa").count(), 1)

    def test_agendar_via_api_segunda_409(self):
        _client(self.ana).post(f"/api/mentoria/horarios/{self.slot.id}/agendar/")
        resp = _client(self.bia).post(f"/api/mentoria/horarios/{self.slot.id}/agendar/")
        self.assertEqual(resp.status_code, 409)

    def test_nao_agenda_passado(self):
        passado = _slot(self.empresa_c, self.criador, dias=-1)
        # cria com data futura e depois força o passado sem validação de serializer
        MentorshipSlot.objects.filter(pk=passado.pk).update(
            inicio=timezone.now() - timedelta(hours=1)
        )
        with self.assertRaises(Indisponivel):
            agendar(self.ana, passado.id)


class LimiteMensalTests(TestCase):
    def setUp(self):
        self.empresa_c = Company.objects.create(
            nome="C", slug="c", status=Company.STATUS_APROVADA
        )
        self.criador = Profile.objects.create(
            supabase_sub="e4", email="e@x.com", username="emp",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_c,
        )
        self.ana = Profile.objects.create(supabase_sub="a2", email="a@x.com", username="ana")

    def test_duas_no_mesmo_mes_falha(self):
        base = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        # dois slots no mesmo mês (+10 e +11 dias ainda caem no mesmo mês na maioria dos casos)
        s1 = _slot(self.empresa_c, self.criador, inicio=base + timedelta(days=2))
        mesmo_mes = base + timedelta(days=3)
        if mesmo_mes.strftime("%Y-%m") != (base + timedelta(days=2)).strftime("%Y-%m"):
            mesmo_mes = base + timedelta(days=1)
        s2 = _slot(self.empresa_c, self.criador, inicio=mesmo_mes)

        agendar(self.ana, s1.id)
        with self.assertRaises(LimiteMensal):
            agendar(self.ana, s2.id)

    def test_mes_diferente_permite(self):
        base = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        s1 = _slot(self.empresa_c, self.criador, inicio=base + timedelta(days=2))
        s2 = _slot(self.empresa_c, self.criador, inicio=base + timedelta(days=45))
        agendar(self.ana, s1.id)
        # mês diferente → não deve levantar
        booking2 = agendar(self.ana, s2.id)
        self.assertEqual(booking2.status, "ativa")


class CancelamentoTests(TestCase):
    def setUp(self):
        self.empresa_c = Company.objects.create(
            nome="C", slug="c", status=Company.STATUS_APROVADA
        )
        self.criador = Profile.objects.create(
            supabase_sub="e5", email="e@x.com", username="emp",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_c,
        )
        self.ana = Profile.objects.create(supabase_sub="a3", email="a@x.com", username="ana")
        self.bia = Profile.objects.create(supabase_sub="b3", email="b@x.com", username="bia")

    def test_cancela_libera_slot(self):
        slot = _slot(self.empresa_c, self.criador, dias=3)
        booking = agendar(self.ana, slot.id)
        cancelar(self.ana, booking.id)
        slot.refresh_from_db()
        self.assertFalse(slot.reservado)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelada")
        # pode agendar de novo depois de liberar
        agendar(self.bia, slot.id)

    def test_cancela_fora_da_janela(self):
        slot = _slot(self.empresa_c, self.criador, dias=3)
        booking = agendar(self.ana, slot.id)
        # aproxima o início para dentro de 24 h
        MentorshipSlot.objects.filter(pk=slot.pk).update(
            inicio=timezone.now() + timedelta(hours=2)
        )
        with self.assertRaises(ForaDaJanela):
            cancelar(self.ana, booking.id)

    def test_cancela_so_dono(self):
        slot = _slot(self.empresa_c, self.criador, dias=3)
        booking = agendar(self.ana, slot.id)
        resp = _client(self.bia).post(f"/api/mentoria/minhas/{booking.id}/cancelar/")
        self.assertEqual(resp.status_code, 404)
