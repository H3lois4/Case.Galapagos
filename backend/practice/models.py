"""
Modelos de prática — Por ELAS finance.

Simulados de múltipla escolha (questões curadas de seed, sem IA) e entrevistas
simuladas com IA (relatório estruturado). O gabarito das questões fica só no
servidor — a correção é feita aqui, nunca no cliente.
"""

from django.db import models


class Question(models.Model):
    tema = models.CharField(max_length=40, db_index=True)  # slug do tema
    enunciado = models.TextField()
    alternativas = models.JSONField(default=list)  # ["a", "b", "c", "d"]
    correta = models.PositiveSmallIntegerField()  # índice 0-based da correta
    explicacao = models.TextField(blank=True)
    # Chave estável para upsert idempotente do seed.
    chave = models.CharField(max_length=64, unique=True)
    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Questão"
        verbose_name_plural = "Questões"
        ordering = ["tema", "id"]
        indexes = [models.Index(fields=["tema", "ativo"])]

    def __str__(self) -> str:
        return f"[{self.tema}] {self.enunciado[:50]}"


class QuizAttempt(models.Model):
    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="simulados"
    )
    tema = models.CharField(max_length=40, db_index=True)
    questao_ids = models.JSONField(default=list)  # ordem das questões da rodada
    respostas = models.JSONField(default=dict)  # {"<questao_id>": indice}
    nota = models.PositiveSmallIntegerField(default=0)  # acertos
    total = models.PositiveSmallIntegerField(default=0)
    finalizado = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Tentativa de simulado"
        verbose_name_plural = "Tentativas de simulado"
        ordering = ["-criado_em"]
        indexes = [models.Index(fields=["profile", "-criado_em"])]

    def __str__(self) -> str:
        return f"{self.profile} — {self.tema} ({self.nota}/{self.total})"


class Interview(models.Model):
    IDIOMA_PT = "pt"
    IDIOMA_EN = "en"

    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="entrevistas"
    )
    conversation = models.ForeignKey(
        "ai.Conversation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="entrevistas",
    )
    vaga = models.CharField(max_length=160)
    papel_entrevistador = models.CharField(max_length=120, blank=True)
    tipo = models.CharField(max_length=60, blank=True)  # comportamental, técnica...
    nivel = models.CharField(max_length=40, blank=True)
    idioma = models.CharField(max_length=10, default=IDIOMA_PT)
    descricao = models.TextField(blank=True)
    relatorio = models.JSONField(null=True, blank=True)  # schema fixo
    nota_geral = models.PositiveSmallIntegerField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Entrevista simulada"
        verbose_name_plural = "Entrevistas simuladas"
        ordering = ["-criado_em"]
        indexes = [models.Index(fields=["profile", "-criado_em"])]

    def __str__(self) -> str:
        return f"{self.profile} — {self.vaga}"
