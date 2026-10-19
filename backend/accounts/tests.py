"""
Testes — contas, verificação de empresa e seguir (Por ELAS finance).
"""

from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings
from django.utils import timezone

from .models import Company, EmailVerification, Follow, Profile
from .serializers import UsernameSerializer
from .services import (
    confirmar_codigo,
    dominio_gratuito,
    vincular_empresa,
)


class UsernameTests(TestCase):
    def test_unicidade_case_insensitive(self):
        p1 = Profile.objects.create(supabase_sub="s1", email="a@x.com", username="Maria")
        self.assertEqual(p1.username_ci, "maria")
        p2 = Profile.objects.create(supabase_sub="s2", email="b@x.com")
        ser = UsernameSerializer(data={"username": "MARIA"}, context={"profile": p2})
        self.assertFalse(ser.is_valid())

    def test_formato_invalido(self):
        p = Profile.objects.create(supabase_sub="s3", email="c@x.com")
        ser = UsernameSerializer(data={"username": "ab"}, context={"profile": p})
        self.assertFalse(ser.is_valid())
        ser2 = UsernameSerializer(data={"username": "com espaço"}, context={"profile": p})
        self.assertFalse(ser2.is_valid())

    def test_formato_valido(self):
        p = Profile.objects.create(supabase_sub="s4", email="d@x.com")
        ser = UsernameSerializer(data={"username": "ana.lima_01"}, context={"profile": p})
        self.assertTrue(ser.is_valid())


class DominioEmpresaTests(TestCase):
    def test_bloqueia_dominio_gratuito(self):
        self.assertTrue(dominio_gratuito("alguem@gmail.com"))
        self.assertTrue(dominio_gratuito("alguem@uol.com.br"))
        self.assertFalse(dominio_gratuito("alguem@galapagoscapital.com"))

    @override_settings(DOMINIOS_PRE_APROVADOS=["galapagoscapital.com"])
    def test_pre_aprovado_aprova_automaticamente(self):
        p = Profile.objects.create(supabase_sub="s5", email="e@x.com")
        v = EmailVerification.objects.create(
            profile=p,
            email_corporativo="mentora@galapagoscapital.com",
            nome_empresa="Galapagos Capital",
            codigo_hash=make_password("123456"),
            expira_em=timezone.now() + timedelta(minutes=15),
        )
        company = vincular_empresa(v)
        self.assertEqual(company.status, Company.STATUS_APROVADA)
        p.refresh_from_db()
        self.assertEqual(p.account_type, Profile.TIPO_EMPRESA)
        self.assertEqual(p.company_id, company.id)

    @override_settings(DOMINIOS_PRE_APROVADOS=[])
    def test_dominio_comum_fica_pendente(self):
        p = Profile.objects.create(supabase_sub="s6", email="f@x.com")
        v = EmailVerification.objects.create(
            profile=p,
            email_corporativo="rh@empresax.com",
            nome_empresa="Empresa X",
            codigo_hash=make_password("123456"),
            expira_em=timezone.now() + timedelta(minutes=15),
        )
        company = vincular_empresa(v)
        self.assertEqual(company.status, Company.STATUS_PENDENTE)


class CodigoVerificacaoTests(TestCase):
    def _verificacao(self, **kw):
        p = Profile.objects.create(supabase_sub=kw.pop("sub", "sv"), email="g@x.com")
        defaults = dict(
            profile=p,
            email_corporativo="rh@empresa.com",
            nome_empresa="Empresa",
            codigo_hash=make_password("123456"),
            expira_em=timezone.now() + timedelta(minutes=15),
        )
        defaults.update(kw)
        return EmailVerification.objects.create(**defaults)

    def test_codigo_correto(self):
        v = self._verificacao()
        ok, _ = confirmar_codigo(v, "123456")
        self.assertTrue(ok)
        self.assertIsNotNone(v.consumido_em)

    def test_codigo_incorreto_conta_tentativa(self):
        v = self._verificacao(sub="sv2")
        ok, _ = confirmar_codigo(v, "000000")
        self.assertFalse(ok)
        v.refresh_from_db()
        self.assertEqual(v.tentativas, 1)

    def test_codigo_expirado(self):
        v = self._verificacao(sub="sv3", expira_em=timezone.now() - timedelta(minutes=1))
        ok, msg = confirmar_codigo(v, "123456")
        self.assertFalse(ok)
        self.assertIn("xpir", msg)

    def test_tentativas_esgotadas(self):
        v = self._verificacao(sub="sv4", tentativas=5)
        ok, _ = confirmar_codigo(v, "123456")
        self.assertFalse(ok)


class SeguirTests(TestCase):
    def test_nao_segue_a_si_mesma_constraint(self):
        from django.db import IntegrityError, transaction

        p = Profile.objects.create(supabase_sub="sf1", email="h@x.com", username="x")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Follow.objects.create(seguidor=p, seguido_profile=p)

    def test_seguir_e_contadores(self):
        a = Profile.objects.create(supabase_sub="sf2", email="i@x.com", username="a")
        b = Profile.objects.create(supabase_sub="sf3", email="j@x.com", username="b")
        Follow.objects.create(seguidor=a, seguido_profile=b)
        self.assertEqual(b.total_seguidores, 1)
        self.assertEqual(a.total_seguindo, 1)
