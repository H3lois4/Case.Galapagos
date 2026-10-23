"""
Testes — Rede (Por ELAS finance).

Feeds RSS e LLM são mockados onde a IA de notícias é exercida. Cobrem: criar
post/vaga/noticia (permissão), feed + filtros, curtir toggle, comentar/excluir,
detalhe público sem auth, dedupe de notícias e o endpoint protegido por
CRON_SECRET.
"""

from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.authentication import ProfileUser
from accounts.models import Company, Follow, Profile

from . import news
from .models import Comment, Post, PostLike


def _client(profile=None):
    client = APIClient()
    if profile:
        client.force_authenticate(user=ProfileUser(profile))
    return client


class CriarPostTests(TestCase):
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

    def test_pessoal_cria_post(self):
        resp = _client(self.pessoal).post(
            "/api/rede/posts/", {"tipo": "post", "texto": "Olá rede!"}, format="json"
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["autor"]["tipo"], "usuaria")

    def test_post_vazio_sem_imagem_falha(self):
        resp = _client(self.pessoal).post(
            "/api/rede/posts/", {"tipo": "post", "texto": "   "}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_pessoal_nao_cria_vaga(self):
        resp = _client(self.pessoal).post(
            "/api/rede/posts/",
            {"tipo": "vaga", "vaga_cargo": "Analista"}, format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_empresa_cria_vaga(self):
        resp = _client(self.empresa).post(
            "/api/rede/posts/",
            {"tipo": "vaga", "vaga_cargo": "Analista", "vaga_local": "Remoto"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["autor"]["tipo"], "empresa")
        self.assertEqual(resp.data["tipo"], "vaga")

    def test_excluir_so_dono(self):
        criar = _client(self.pessoal).post(
            "/api/rede/posts/", {"tipo": "post", "texto": "meu"}, format="json"
        )
        pid = criar.data["id"]
        resp = _client(self.empresa).delete(f"/api/rede/posts/{pid}/")
        self.assertEqual(resp.status_code, 403)
        ok = _client(self.pessoal).delete(f"/api/rede/posts/{pid}/")
        self.assertEqual(ok.status_code, 204)


class FeedFiltroTests(TestCase):
    def setUp(self):
        self.ana = Profile.objects.create(supabase_sub="a", email="a@x.com", username="ana")
        self.bia = Profile.objects.create(supabase_sub="b", email="b@x.com", username="bia")
        self.empresa_c = Company.objects.create(
            nome="C", slug="c", status=Company.STATUS_APROVADA
        )
        self.emp = Profile.objects.create(
            supabase_sub="e", email="e@x.com", username="emp",
            account_type=Profile.TIPO_EMPRESA, company=self.empresa_c,
        )
        Post.objects.create(autor=self.bia, tipo="post", texto="post da bia")
        Post.objects.create(
            autor=self.emp, company=self.empresa_c, tipo="vaga", vaga_cargo="Dev"
        )
        Post.objects.create(origem_ia=True, tipo="noticia", titulo="Juros sobem", texto="...")

    def test_feed_todos(self):
        resp = _client(self.ana).get("/api/rede/posts/")
        self.assertEqual(resp.data["count"], 3)

    def test_filtro_vagas(self):
        resp = _client(self.ana).get("/api/rede/posts/?filtro=vagas")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["tipo"], "vaga")

    def test_filtro_seguindo(self):
        Follow.objects.create(seguidor=self.ana, seguido_profile=self.bia)
        resp = _client(self.ana).get("/api/rede/posts/?filtro=seguindo")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["autor"]["username"], "bia")


class InteracaoTests(TestCase):
    def setUp(self):
        self.ana = Profile.objects.create(supabase_sub="a", email="a@x.com", username="ana")
        self.bia = Profile.objects.create(supabase_sub="b", email="b@x.com", username="bia")
        self.post = Post.objects.create(autor=self.bia, tipo="post", texto="oi")

    def test_curtir_toggle(self):
        c = _client(self.ana)
        r1 = c.post(f"/api/rede/posts/{self.post.id}/curtir/")
        self.assertTrue(r1.data["curtiu"])
        self.assertEqual(r1.data["curtidas_count"], 1)
        r2 = c.post(f"/api/rede/posts/{self.post.id}/curtir/")
        self.assertFalse(r2.data["curtiu"])
        self.assertEqual(r2.data["curtidas_count"], 0)

    def test_comentar_e_contador(self):
        c = _client(self.ana)
        c.post(
            f"/api/rede/posts/{self.post.id}/comentarios/",
            {"texto": "massa!"}, format="json",
        )
        self.post.refresh_from_db()
        self.assertEqual(self.post.comentarios_count, 1)

    def test_excluir_comentario_dono_do_post(self):
        # ana comenta no post da bia; bia (dona do post) pode excluir
        comentar = _client(self.ana).post(
            f"/api/rede/posts/{self.post.id}/comentarios/",
            {"texto": "oi"}, format="json",
        )
        cid = comentar.data["id"]
        resp = _client(self.bia).delete(f"/api/rede/comentarios/{cid}/")
        self.assertEqual(resp.status_code, 204)
        self.post.refresh_from_db()
        self.assertEqual(self.post.comentarios_count, 0)

    def test_excluir_comentario_terceiro_falha(self):
        comentar = _client(self.bia).post(
            f"/api/rede/posts/{self.post.id}/comentarios/",
            {"texto": "oi"}, format="json",
        )
        cid = comentar.data["id"]
        resp = _client(self.ana).delete(f"/api/rede/comentarios/{cid}/")
        self.assertEqual(resp.status_code, 403)


class DetalhePublicoTests(TestCase):
    def test_detalhe_sem_login(self):
        bia = Profile.objects.create(supabase_sub="b", email="b@x.com", username="bia")
        post = Post.objects.create(autor=bia, tipo="post", texto="público")
        resp = _client().get(f"/api/rede/posts/{post.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["texto"], "público")


class NoticiasIATests(TestCase):
    @override_settings(
        CRON_SECRET="segredo", NEWS_FEEDS="http://feed", NEWS_MAX_POR_RUN=2,
        GEMINI_API_KEY="k", LLM_PROVIDER="gemini",
    )
    def test_run_news_cria_e_dedup(self):
        itens = [
            {"titulo": "Selic sobe", "link": "http://n/1", "descricao": "texto 1"},
            {"titulo": "Bolsa cai", "link": "http://n/2", "descricao": "texto 2"},
        ]
        reescrito = {"titulo": "Resumo", "categoria": "juros", "resumo": "resumo curto"}
        with mock.patch.object(news, "_ler_feed", return_value=itens), mock.patch.object(
            news, "_reescrever", return_value=reescrito
        ):
            resp = _client().post("/api/ai/news/run/?secret=segredo")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["criadas"], 2)
        self.assertEqual(Post.objects.filter(tipo="noticia", origem_ia=True).count(), 2)

        # rodar de novo não duplica (mesmos links)
        with mock.patch.object(news, "_ler_feed", return_value=itens), mock.patch.object(
            news, "_reescrever", return_value=reescrito
        ):
            resp2 = _client().post("/api/ai/news/run/?secret=segredo")
        self.assertEqual(resp2.data["criadas"], 0)

    @override_settings(CRON_SECRET="segredo")
    def test_run_news_sem_segredo_401(self):
        resp = _client().post("/api/ai/news/run/?secret=errado")
        self.assertEqual(resp.status_code, 401)

    @override_settings(CRON_SECRET="")
    def test_run_news_sem_cron_configurada_503(self):
        resp = _client().post("/api/ai/news/run/")
        self.assertEqual(resp.status_code, 503)
