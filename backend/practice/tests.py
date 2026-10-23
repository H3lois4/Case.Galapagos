"""
Testes — prática (Por ELAS finance).

O provedor de LLM é mockado para o relatório da entrevista (sem rede). Cobrem:
seed idempotente, temas + contagem, iniciar simulado (sem gabarito no payload),
correção no servidor, não recorrigir, dono-only, e geração de relatório
(JSON ok e inválido → 422).
"""

from unittest import mock

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.authentication import ProfileUser
from accounts.models import Profile

from . import services_interview
from .models import Interview, Question, QuizAttempt
from .temas import TEMAS_SLUGS


def _client(profile):
    client = APIClient()
    client.force_authenticate(user=ProfileUser(profile))
    return client


class FakeProvider:
    def __init__(self, texto):
        self.texto = texto

    def chat(self, messages, system, stream=True, **kw):
        yield self.texto


class SeedQuestionsTests(TestCase):
    def test_seed_idempotente_e_todos_os_temas(self):
        call_command("seed_questions")
        total = Question.objects.count()
        self.assertGreaterEqual(total, 6)
        # cada tema tem ao menos uma questão
        temas_com_questao = set(
            Question.objects.values_list("tema", flat=True).distinct()
        )
        self.assertEqual(TEMAS_SLUGS, temas_com_questao)
        # rodar de novo não duplica
        call_command("seed_questions")
        self.assertEqual(Question.objects.count(), total)


class TemasAPITests(TestCase):
    def setUp(self):
        call_command("seed_questions")
        self.profile = Profile.objects.create(
            supabase_sub="t1", email="t@x.com", username="t"
        )

    def test_lista_temas_com_contagem(self):
        resp = _client(self.profile).get("/api/pratica/temas/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 6)
        mf = next(t for t in resp.data if t["slug"] == "mercado-financeiro")
        self.assertGreaterEqual(mf["questoes"], 1)


class SimuladoTests(TestCase):
    def setUp(self):
        call_command("seed_questions")
        self.profile = Profile.objects.create(
            supabase_sub="s1", email="s@x.com", username="s"
        )

    def test_iniciar_sem_gabarito(self):
        resp = _client(self.profile).post(
            "/api/pratica/simulados/", {"tema": "mercado-financeiro"}, format="json"
        )
        self.assertEqual(resp.status_code, 201)
        questoes = resp.data["questoes"]
        self.assertTrue(len(questoes) >= 1)
        # nenhuma questão pode vazar o gabarito/explicação
        for q in questoes:
            self.assertNotIn("correta", q)
            self.assertNotIn("explicacao", q)

    def test_tema_invalido(self):
        resp = _client(self.profile).post(
            "/api/pratica/simulados/", {"tema": "nao-existe"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_correcao_calcula_nota(self):
        c = _client(self.profile)
        inicio = c.post(
            "/api/pratica/simulados/", {"tema": "mercado-financeiro"}, format="json"
        )
        attempt_id = inicio.data["attempt_id"]
        attempt = QuizAttempt.objects.get(pk=attempt_id)
        # responde todas corretamente, consultando o gabarito no banco
        gabarito = {
            str(q.id): q.correta
            for q in Question.objects.filter(id__in=attempt.questao_ids)
        }
        resp = c.post(
            f"/api/pratica/simulados/{attempt_id}/responder/",
            {"respostas": gabarito}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["nota"], resp.data["total"])
        # revisão traz explicação e correta
        self.assertIn("explicacao", resp.data["revisao"][0])
        self.assertIn("correta", resp.data["revisao"][0])

    def test_nao_recorrige(self):
        c = _client(self.profile)
        inicio = c.post(
            "/api/pratica/simulados/", {"tema": "excel"}, format="json"
        )
        aid = inicio.data["attempt_id"]
        c.post(f"/api/pratica/simulados/{aid}/responder/", {"respostas": {}}, format="json")
        segunda = c.post(
            f"/api/pratica/simulados/{aid}/responder/", {"respostas": {}}, format="json"
        )
        self.assertEqual(segunda.status_code, 400)

    def test_responder_so_dono(self):
        c = _client(self.profile)
        inicio = c.post("/api/pratica/simulados/", {"tema": "ingles"}, format="json")
        aid = inicio.data["attempt_id"]
        outra = Profile.objects.create(supabase_sub="o1", email="o@x.com", username="o")
        resp = _client(outra).post(
            f"/api/pratica/simulados/{aid}/responder/", {"respostas": {}}, format="json"
        )
        self.assertEqual(resp.status_code, 404)

    def test_historico(self):
        c = _client(self.profile)
        inicio = c.post("/api/pratica/simulados/", {"tema": "excel"}, format="json")
        aid = inicio.data["attempt_id"]
        c.post(f"/api/pratica/simulados/{aid}/responder/", {"respostas": {}}, format="json")
        hist = c.get("/api/pratica/simulados/historico/")
        self.assertEqual(hist.status_code, 200)
        self.assertEqual(len(hist.data), 1)


class EntrevistaTests(TestCase):
    def setUp(self):
        self.profile = Profile.objects.create(
            supabase_sub="e1", email="e@x.com", username="e"
        )

    def test_criar_entrevista(self):
        resp = _client(self.profile).post(
            "/api/pratica/entrevistas/",
            {"vaga": "Analista de M&A", "tipo": "comportamental", "nivel": "júnior"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIsNotNone(resp.data["conversa_id"])
        interview = Interview.objects.get(pk=resp.data["id"])
        # a conversa foi criada com a mensagem de contexto
        self.assertEqual(interview.conversation.mensagens.count(), 1)

    def test_relatorio_json_valido(self):
        criar = _client(self.profile).post(
            "/api/pratica/entrevistas/", {"vaga": "Trader"}, format="json"
        )
        iid = criar.data["id"]
        # adiciona uma resposta da IA para ter conversa suficiente
        interview = Interview.objects.get(pk=iid)
        from ai.models import Message

        Message.objects.create(
            conversation=interview.conversation,
            papel=Message.PAPEL_ASSISTANT,
            conteudo="Primeira pergunta: fale sobre você.",
            ordem=2,
        )
        fake = FakeProvider(
            '{"nota_geral": 8, "pontos_fortes": ["clareza"], "melhorias": ["exemplos"],'
            '"por_pergunta": [{"pergunta":"p","resumo_resposta":"r","avaliacao":"a","sugestao":"s"}],'
            '"proximos_passos": ["praticar"]}'
        )
        with mock.patch.object(services_interview, "get_provider", return_value=fake):
            resp = _client(self.profile).post(
                f"/api/pratica/entrevistas/{iid}/relatorio/"
            )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["nota_geral"], 8)
        interview.refresh_from_db()
        self.assertEqual(interview.nota_geral, 8)

    def test_relatorio_json_invalido_422(self):
        criar = _client(self.profile).post(
            "/api/pratica/entrevistas/", {"vaga": "Trader"}, format="json"
        )
        iid = criar.data["id"]
        interview = Interview.objects.get(pk=iid)
        from ai.models import Message

        Message.objects.create(
            conversation=interview.conversation,
            papel=Message.PAPEL_ASSISTANT, conteudo="pergunta", ordem=2,
        )
        fake = FakeProvider("não consigo gerar agora")
        with mock.patch.object(services_interview, "get_provider", return_value=fake):
            resp = _client(self.profile).post(
                f"/api/pratica/entrevistas/{iid}/relatorio/"
            )
        self.assertEqual(resp.status_code, 422)

    def test_entrevista_so_dono(self):
        criar = _client(self.profile).post(
            "/api/pratica/entrevistas/", {"vaga": "X"}, format="json"
        )
        iid = criar.data["id"]
        outra = Profile.objects.create(supabase_sub="o2", email="o@x.com", username="o2")
        resp = _client(outra).get(f"/api/pratica/entrevistas/{iid}/")
        self.assertEqual(resp.status_code, 404)
