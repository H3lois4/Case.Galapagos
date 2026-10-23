"""
Testes — IA (Por ELAS finance).

O provedor de LLM é mockado (um fake que emite pedaços fixos), então os testes
não fazem rede. Cobrem: fábrica por env, montar_system, rate limit, dono-only,
feedback e o fluxo SSE (token→done) com persistência da mensagem da IA.
"""

from unittest import mock

from django.test import TestCase, override_settings

from accounts.authentication import ProfileUser
from accounts.models import Profile
from rest_framework.test import APIClient

from . import agents, services, views
from .agents import AGENTES, montar_system
from .models import Conversation, Message, MessageFeedback
from .providers import ProviderError, get_provider, limpar_cache


class FakeProvider:
    """Provedor falso: emite pedaços fixos, sem rede."""

    def __init__(self, pedacos=None):
        self.pedacos = pedacos or ["Olá", ", ", "tudo bem?"]
        self.ultimo_system = None
        self.ultimas_mensagens = None

    def chat(self, messages, system, stream=True, **kwargs):
        self.ultimo_system = system
        self.ultimas_mensagens = messages
        for p in self.pedacos:
            yield p


def _client(profile):
    client = APIClient()
    client.force_authenticate(user=ProfileUser(profile))
    return client


class ProviderFactoryTests(TestCase):
    def setUp(self):
        limpar_cache()

    def tearDown(self):
        limpar_cache()

    @override_settings(LLM_PROVIDER="gemini")
    def test_fabrica_gemini_por_padrao(self):
        from .providers.gemini import GeminiProvider

        self.assertIsInstance(get_provider(), GeminiProvider)

    @override_settings(LLM_PROVIDER="openai")
    def test_fabrica_openai(self):
        from .providers.openai import OpenAIProvider

        self.assertIsInstance(get_provider(), OpenAIProvider)

    def test_provedor_desconhecido(self):
        with self.assertRaises(ProviderError):
            get_provider("inexistente")

    @override_settings(GEMINI_API_KEY="")
    def test_gemini_sem_chave_erra_claro(self):
        from .providers.gemini import GeminiProvider

        with self.assertRaises(ProviderError):
            list(GeminiProvider().chat([{"role": "user", "content": "oi"}], system=""))


class MontarSystemTests(TestCase):
    def setUp(self):
        agents.limpar_cache()
        self.profile = Profile.objects.create(
            supabase_sub="s1", email="a@x.com", username="ana",
            nome_exibicao="Ana", account_type="pessoal",
        )

    def test_inclui_regras_conhecimento_e_contexto(self):
        agente = AGENTES["assistente"]
        system = montar_system(agente, profile=self.profile, resumo="Quer migrar de área.")
        # Regra global
        self.assertIn("Por ELAS finance", system)
        self.assertIn("investimento específico", system)
        # Conhecimento injetado (vem do knowledge/assistente/plataforma.md)
        self.assertIn("mercado financeiro", system.lower())
        # Contexto da usuária
        self.assertIn("Ana", system)
        # Resumo (memória)
        self.assertIn("migrar de área", system)


class RateLimitTests(TestCase):
    def setUp(self):
        self.profile = Profile.objects.create(
            supabase_sub="r1", email="r@x.com", username="rate"
        )

    @override_settings(AI_RATE_LIMIT_PER_HOUR=2)
    def test_bloqueia_no_limite(self):
        conversa = Conversation.objects.create(profile=self.profile, agente="assistente")
        for i in range(2):
            Message.objects.create(
                conversation=conversa, papel=Message.PAPEL_USER, conteudo="x", ordem=i + 1
            )
        from .ratelimit import checar_limite

        permitido, retry = checar_limite(self.profile)
        self.assertFalse(permitido)
        self.assertGreater(retry, 0)

    @override_settings(AI_RATE_LIMIT_PER_HOUR=5)
    def test_permite_abaixo_do_limite(self):
        from .ratelimit import checar_limite

        permitido, _ = checar_limite(self.profile)
        self.assertTrue(permitido)


class ConversaDonoTests(TestCase):
    def setUp(self):
        self.a = Profile.objects.create(supabase_sub="a1", email="a@x.com", username="a")
        self.b = Profile.objects.create(supabase_sub="b1", email="b@x.com", username="b")
        self.conversa = Conversation.objects.create(profile=self.a, agente="assistente")

    def test_outra_usuaria_nao_ve_conversa(self):
        resp = _client(self.b).get(f"/api/ai/conversas/{self.conversa.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_dona_ve_conversa(self):
        resp = _client(self.a).get(f"/api/ai/conversas/{self.conversa.id}/")
        self.assertEqual(resp.status_code, 200)

    def test_cria_conversa_agente_invalido(self):
        resp = _client(self.a).post(
            "/api/ai/conversas/", {"agente": "nao-existe"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)


class FeedbackTests(TestCase):
    def setUp(self):
        self.profile = Profile.objects.create(
            supabase_sub="f1", email="f@x.com", username="fb"
        )
        self.conversa = Conversation.objects.create(
            profile=self.profile, agente="assistente"
        )
        self.msg_ia = Message.objects.create(
            conversation=self.conversa, papel=Message.PAPEL_ASSISTANT,
            conteudo="resposta", ordem=1,
        )

    def test_registra_feedback(self):
        resp = _client(self.profile).post(
            f"/api/ai/mensagens/{self.msg_ia.id}/feedback/",
            {"util": True}, format="json",
        )
        self.assertEqual(resp.status_code, 200)
        fb = MessageFeedback.objects.get(message=self.msg_ia)
        self.assertTrue(fb.util)

    def test_feedback_atualiza(self):
        c = _client(self.profile)
        c.post(f"/api/ai/mensagens/{self.msg_ia.id}/feedback/", {"util": True}, format="json")
        c.post(f"/api/ai/mensagens/{self.msg_ia.id}/feedback/", {"util": False}, format="json")
        self.assertEqual(MessageFeedback.objects.filter(message=self.msg_ia).count(), 1)
        self.assertFalse(MessageFeedback.objects.get(message=self.msg_ia).util)


class ChatSSETests(TestCase):
    def setUp(self):
        self.profile = Profile.objects.create(
            supabase_sub="c1", email="c@x.com", username="chat",
            nome_exibicao="Chat", account_type="pessoal",
        )

    def _consumir(self, resp):
        return b"".join(resp.streaming_content).decode("utf-8")

    def test_chat_stream_e_persiste(self):
        fake = FakeProvider(["Oi", "!", " Como posso ajudar?"])
        with mock.patch.object(views, "get_provider", return_value=fake):
            resp = _client(self.profile).post(
                "/api/ai/chat/",
                {"agente": "assistente", "mensagem": "quero começar no mercado"},
                format="json",
            )
            corpo = self._consumir(resp)

        self.assertEqual(resp.status_code, 200)
        self.assertIn("text/event-stream", resp["Content-Type"])
        self.assertIn("event: meta", corpo)
        self.assertIn("event: token", corpo)
        self.assertIn("event: done", corpo)

        conversa = Conversation.objects.get(profile=self.profile)
        papeis = list(conversa.mensagens.order_by("ordem").values_list("papel", "conteudo"))
        self.assertEqual(papeis[0][0], "user")
        self.assertEqual(papeis[1][0], "assistant")
        self.assertEqual(papeis[1][1], "Oi! Como posso ajudar?")
        # título gerado a partir da 1ª mensagem
        self.assertTrue(conversa.titulo)
        # o system recebido inclui as regras globais
        self.assertIn("Por ELAS finance", fake.ultimo_system)

    def test_chat_erro_do_provedor_nao_persiste_ia(self):
        class ProvedorQuebra:
            def chat(self, messages, system, stream=True, **kw):
                raise ProviderError("sem chave")
                yield  # pragma: no cover

        with mock.patch.object(views, "get_provider", return_value=ProvedorQuebra()):
            resp = _client(self.profile).post(
                "/api/ai/chat/",
                {"agente": "assistente", "mensagem": "oi"},
                format="json",
            )
            corpo = self._consumir(resp)

        self.assertIn("event: error", corpo)
        conversa = Conversation.objects.get(profile=self.profile)
        # a mensagem da usuária é salva, mas não há mensagem da IA
        self.assertEqual(conversa.mensagens.filter(papel="assistant").count(), 0)

    @override_settings(AI_RATE_LIMIT_PER_HOUR=1)
    def test_chat_respeita_rate_limit(self):
        conversa = Conversation.objects.create(profile=self.profile, agente="assistente")
        Message.objects.create(
            conversation=conversa, papel=Message.PAPEL_USER, conteudo="x", ordem=1
        )
        resp = _client(self.profile).post(
            "/api/ai/chat/",
            {"agente": "assistente", "mensagem": "mais uma"},
            format="json",
        )
        self.assertEqual(resp.status_code, 429)
        self.assertIn("Retry-After", resp)
