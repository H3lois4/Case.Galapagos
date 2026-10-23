"""
Testes — aulas (Por ELAS finance).

Cobrem: validação de tipo/tamanho no storage, permissão (só empresa aprovada
gera presign/cria), filtros/busca na listagem e checagem de dono para
editar/excluir.
"""

from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.authentication import ProfileUser
from accounts.models import Company, Profile

from . import storage
from .models import Lesson


def _client(profile: Profile) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=ProfileUser(profile))
    return client


class StorageValidacaoTests(TestCase):
    def test_video_tipo_invalido(self):
        with self.assertRaises(storage.UploadInvalido):
            storage.validar_upload("video", "video/avi", 1000)

    def test_video_tamanho_acima(self):
        with self.assertRaises(storage.UploadInvalido):
            storage.validar_upload("video", "video/mp4", 300 * 1024 * 1024)

    def test_video_ok(self):
        self.assertEqual(storage.validar_upload("video", "video/mp4", 1000), "mp4")
        self.assertEqual(storage.validar_upload("video", "video/webm", 1000), "webm")

    def test_imagem_ok_e_limite(self):
        self.assertEqual(storage.validar_upload("imagem", "image/png", 1000), "png")
        with self.assertRaises(storage.UploadInvalido):
            storage.validar_upload("imagem", "image/png", 10 * 1024 * 1024)

    def test_chave_por_empresa(self):
        key = storage.gerar_chave("video", "mp4", "galapagos")
        self.assertTrue(key.startswith("aulas/galapagos/videos/"))
        self.assertTrue(key.endswith(".mp4"))
        key_ia = storage.gerar_chave("imagem", "png", None)
        self.assertTrue(key_ia.startswith("aulas/ia/thumbs/"))


class PermissaoUploadTests(TestCase):
    def setUp(self):
        self.aprovada = Company.objects.create(
            nome="Galapagos", slug="galapagos", status=Company.STATUS_APROVADA
        )
        self.pendente = Company.objects.create(
            nome="Pendente", slug="pendente", status=Company.STATUS_PENDENTE
        )
        self.p_empresa = Profile.objects.create(
            supabase_sub="e1", email="e@x.com", username="empresa",
            account_type=Profile.TIPO_EMPRESA, company=self.aprovada,
        )
        self.p_pendente = Profile.objects.create(
            supabase_sub="e2", email="p@x.com", username="pendente",
            account_type=Profile.TIPO_EMPRESA, company=self.pendente,
        )
        self.p_pessoal = Profile.objects.create(
            supabase_sub="u1", email="u@x.com", username="pessoal",
        )

    @override_settings(
        R2_ACCOUNT_ID="acc", R2_ACCESS_KEY_ID="k", R2_SECRET_ACCESS_KEY="s",
        R2_BUCKET="b", R2_PUBLIC_BASE_URL="https://pub.r2.dev",
    )
    @mock.patch("lessons.storage.presign_put", return_value="https://pub.r2.dev/signed")
    def test_empresa_aprovada_gera_presign(self, _mock):
        resp = _client(self.p_empresa).post(
            "/api/aulas/upload-url/",
            {"tipo": "video", "content_type": "video/mp4", "tamanho": 1000},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("url", resp.data)
        self.assertIn("key", resp.data)

    def test_empresa_pendente_bloqueada(self):
        resp = _client(self.p_pendente).post(
            "/api/aulas/upload-url/",
            {"tipo": "video", "content_type": "video/mp4", "tamanho": 1000},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_pessoal_nao_cria_aula(self):
        resp = _client(self.p_pessoal).post(
            "/api/aulas/",
            {"titulo": "x", "video_key": "aulas/ia/videos/a.mp4"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    @override_settings(R2_PUBLIC_BASE_URL="https://pub.r2.dev")
    def test_empresa_aprovada_cria_aula(self):
        resp = _client(self.p_empresa).post(
            "/api/aulas/",
            {
                "titulo": "Introdução à renda fixa",
                "descricao": "Básico",
                "video_key": "aulas/galapagos/videos/a.mp4",
                "duracao_seg": 120,
                "tamanho_bytes": 5000,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        aula = Lesson.objects.get()
        self.assertEqual(aula.company_id, self.aprovada.id)
        self.assertEqual(aula.video_url, "https://pub.r2.dev/aulas/galapagos/videos/a.mp4")


class ListagemFiltroTests(TestCase):
    def setUp(self):
        self.empresa_a = Company.objects.create(
            nome="Alfa", slug="alfa", status=Company.STATUS_APROVADA
        )
        self.empresa_b = Company.objects.create(
            nome="Beta", slug="beta", status=Company.STATUS_APROVADA
        )
        self.viewer = Profile.objects.create(
            supabase_sub="v1", email="v@x.com", username="viewer"
        )
        Lesson.objects.create(
            company=self.empresa_a, titulo="Renda fixa para iniciantes",
            video_url="https://pub/a1.mp4",
        )
        Lesson.objects.create(
            company=self.empresa_b, titulo="Ações e dividendos",
            video_url="https://pub/b1.mp4",
        )
        Lesson.objects.create(
            origem=Lesson.ORIGEM_IA, titulo="O que é o mercado financeiro",
            video_url="https://pub/ia1.mp4",
        )

    def test_lista_todas(self):
        resp = _client(self.viewer).get("/api/aulas/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 3)

    def test_filtra_por_empresa(self):
        resp = _client(self.viewer).get("/api/aulas/?empresa=alfa")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["empresa_slug"], "alfa")

    def test_filtra_por_origem_ia(self):
        resp = _client(self.viewer).get("/api/aulas/?origem=ia")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["origem"], "ia")

    def test_busca_por_titulo(self):
        resp = _client(self.viewer).get("/api/aulas/?q=renda")
        self.assertEqual(resp.data["count"], 1)
        resp_vazio = _client(self.viewer).get("/api/aulas/?q=cripto")
        self.assertEqual(resp_vazio.data["count"], 0)

    def test_empresas_com_aulas(self):
        resp = _client(self.viewer).get("/api/aulas/empresas/")
        self.assertEqual(resp.status_code, 200)
        slugs = {e["slug"] for e in resp.data["empresas"]}
        self.assertEqual(slugs, {"alfa", "beta"})
        self.assertTrue(resp.data["tem_ia"])


class DonoEdicaoTests(TestCase):
    def setUp(self):
        self.empresa_a = Company.objects.create(
            nome="Alfa", slug="alfa", status=Company.STATUS_APROVADA
        )
        self.empresa_b = Company.objects.create(
            nome="Beta", slug="beta", status=Company.STATUS_APROVADA
        )
        self.dona = Profile.objects.create(
            supabase_sub="d1", email="d@x.com", username="dona",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_a,
        )
        self.outra = Profile.objects.create(
            supabase_sub="o1", email="o@x.com", username="outra",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_b,
        )
        self.aula = Lesson.objects.create(
            company=self.empresa_a, titulo="Original", video_url="https://pub/a.mp4",
            video_key="aulas/alfa/videos/a.mp4",
        )

    def test_dona_edita(self):
        resp = _client(self.dona).patch(
            f"/api/aulas/{self.aula.id}/", {"titulo": "Editado"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.aula.refresh_from_db()
        self.assertEqual(self.aula.titulo, "Editado")

    def test_outra_empresa_nao_edita(self):
        resp = _client(self.outra).patch(
            f"/api/aulas/{self.aula.id}/", {"titulo": "Hack"}, format="json"
        )
        self.assertEqual(resp.status_code, 403)

    def test_outra_empresa_nao_exclui(self):
        resp = _client(self.outra).delete(f"/api/aulas/{self.aula.id}/")
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(Lesson.objects.filter(id=self.aula.id).exists())

    @mock.patch("lessons.storage.deletar")
    def test_dona_exclui(self, mock_deletar):
        resp = _client(self.dona).delete(f"/api/aulas/{self.aula.id}/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Lesson.objects.filter(id=self.aula.id).exists())
        mock_deletar.assert_any_call("aulas/alfa/videos/a.mp4")
