"""
Testes — seed de demonstração (Por ELAS finance).
"""

from django.core.management import call_command
from django.test import TestCase

from accounts.models import Company, Profile
from lessons.models import Lesson
from mentorship.models import MentorshipSlot
from network.models import Post


class SeedDemoTests(TestCase):
    def test_cria_dados(self):
        call_command("seed_demo")
        self.assertEqual(
            Company.objects.filter(status=Company.STATUS_APROVADA).count(), 2
        )
        self.assertEqual(
            Profile.objects.filter(supabase_sub__startswith="demo-").count(), 4
        )
        self.assertTrue(Lesson.objects.filter(origem=Lesson.ORIGEM_IA).exists())
        self.assertTrue(MentorshipSlot.objects.exists())
        self.assertTrue(Post.objects.filter(tipo=Post.TIPO_VAGA).exists())
        self.assertTrue(
            Post.objects.filter(tipo=Post.TIPO_NOTICIA, origem_ia=True).exists()
        )

    def test_idempotente(self):
        call_command("seed_demo")
        aulas = Lesson.objects.count()
        posts = Post.objects.count()
        slots = MentorshipSlot.objects.count()
        call_command("seed_demo")
        self.assertEqual(Lesson.objects.count(), aulas)
        self.assertEqual(Post.objects.count(), posts)
        self.assertEqual(MentorshipSlot.objects.count(), slots)

    def test_limpar_remove_demo_preserva_reais(self):
        # dado real (não-demo) que não deve ser removido
        real = Profile.objects.create(
            supabase_sub="real-123", email="real@x.com", username="real"
        )
        call_command("seed_demo")
        self.assertTrue(
            Profile.objects.filter(supabase_sub__startswith="demo-").exists()
        )

        call_command("seed_demo", "--limpar")
        self.assertFalse(
            Profile.objects.filter(supabase_sub__startswith="demo-").exists()
        )
        self.assertFalse(Company.objects.filter(slug__startswith="demo-").exists())
        # o perfil real continua
        self.assertTrue(Profile.objects.filter(pk=real.pk).exists())
