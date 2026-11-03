"""
Testes — seed inicial (Por ELAS finance).
"""

from django.core.management import call_command
from django.test import TestCase

from accounts.models import Company
from network.models import Post


class SeedDemoTests(TestCase):
    def test_cria_dados(self):
        call_command("seed_demo")
        # Uma empresa aprovada (Galapagos Capital), sem "(demo)" no nome.
        self.assertEqual(
            Company.objects.filter(status=Company.STATUS_APROVADA).count(), 1
        )
        galapagos = Company.objects.get(slug="galapagos-capital")
        self.assertEqual(galapagos.nome, "Galapagos Capital")
        # Notícias da Por ELAS com imagem e fonte.
        noticias = Post.objects.filter(tipo=Post.TIPO_NOTICIA, origem_ia=True)
        self.assertGreaterEqual(noticias.count(), 1)
        for n in noticias:
            self.assertTrue(n.imagem_url)
            self.assertTrue(n.fonte_url)
        # Uma vaga da empresa.
        self.assertTrue(Post.objects.filter(tipo=Post.TIPO_VAGA).exists())

    def test_idempotente(self):
        call_command("seed_demo")
        posts = Post.objects.count()
        empresas = Company.objects.count()
        call_command("seed_demo")
        self.assertEqual(Post.objects.count(), posts)
        self.assertEqual(Company.objects.count(), empresas)

    def test_limpar_remove_noticias_preserva_empresa(self):
        call_command("seed_demo")
        self.assertTrue(
            Post.objects.filter(tipo=Post.TIPO_NOTICIA, origem_ia=True).exists()
        )
        call_command("seed_demo", "--limpar")
        self.assertFalse(
            Post.objects.filter(tipo=Post.TIPO_NOTICIA, origem_ia=True).exists()
        )
        # a empresa não é removida pela limpeza
        self.assertTrue(Company.objects.filter(slug="galapagos-capital").exists())
