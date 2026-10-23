"""
Modelos de IA — Por ELAS finance.

Conversas e mensagens dão memória aos agentes; o resumo curto é reinjetado nas
próximas conversas. O feedback (👍/👎) ajuda a ajustar os prompts.
"""

from django.db import models


class Conversation(models.Model):
    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="conversas"
    )
    agente = models.CharField(max_length=40, db_index=True)  # chave do agente
    titulo = models.CharField(max_length=160, blank=True)
    resumo = models.TextField(blank=True)  # memória curta da conversa
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversa"
        verbose_name_plural = "Conversas"
        ordering = ["-atualizado_em"]
        indexes = [
            models.Index(fields=["profile", "agente"]),
            models.Index(fields=["-atualizado_em"]),
        ]

    def __str__(self) -> str:
        return self.titulo or f"Conversa {self.pk} ({self.agente})"

    @property
    def proxima_ordem(self) -> int:
        ultima = self.mensagens.order_by("-ordem").values_list("ordem", flat=True).first()
        return (ultima or 0) + 1


class Message(models.Model):
    PAPEL_USER = "user"
    PAPEL_ASSISTANT = "assistant"
    PAPEL_CHOICES = [
        (PAPEL_USER, "Usuária"),
        (PAPEL_ASSISTANT, "IA"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="mensagens"
    )
    papel = models.CharField(max_length=10, choices=PAPEL_CHOICES)
    conteudo = models.TextField()
    ordem = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mensagem"
        verbose_name_plural = "Mensagens"
        ordering = ["conversation_id", "ordem"]
        indexes = [
            models.Index(fields=["conversation", "ordem"]),
        ]

    def __str__(self) -> str:
        return f"[{self.papel}] {self.conteudo[:40]}"


class MessageFeedback(models.Model):
    message = models.OneToOneField(
        Message, on_delete=models.CASCADE, related_name="feedback"
    )
    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="feedbacks_ia"
    )
    util = models.BooleanField()  # 👍 True / 👎 False
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Feedback de resposta"
        verbose_name_plural = "Feedbacks de resposta"
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        return f"{'👍' if self.util else '👎'} msg {self.message_id}"
