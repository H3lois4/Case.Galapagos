"""
Modelos de aulas — Por ELAS finance.

Aulas em vídeo publicadas por empresas aprovadas ou pela conta oficial
("Básico com IA"). Os arquivos de vídeo/thumbnail ficam no Cloudflare R2;
aqui guardamos apenas a chave do objeto e a URL pública de leitura.
"""

from django.db import models


class Lesson(models.Model):
    ORIGEM_EMPRESA = "empresa"
    ORIGEM_IA = "ia"  # Básico com IA (conta oficial Por ELAS)
    ORIGEM_CHOICES = [
        (ORIGEM_EMPRESA, "Empresa"),
        (ORIGEM_IA, "Básico com IA"),
    ]

    company = models.ForeignKey(
        "accounts.Company",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="aulas",
    )
    origem = models.CharField(
        max_length=10, choices=ORIGEM_CHOICES, default=ORIGEM_EMPRESA, db_index=True
    )
    autor = models.ForeignKey(
        "accounts.Profile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="aulas",
    )
    titulo = models.CharField(max_length=160)
    descricao = models.TextField(blank=True)
    video_key = models.CharField(max_length=512, blank=True)  # chave do objeto no R2
    video_url = models.URLField(max_length=700)  # URL pública de leitura
    thumb_key = models.CharField(max_length=512, blank=True)
    thumb_url = models.URLField(max_length=700, blank=True)
    duracao_seg = models.PositiveIntegerField(default=0)
    tamanho_bytes = models.BigIntegerField(default=0)
    publicado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Aula"
        verbose_name_plural = "Aulas"
        ordering = ["-publicado_em"]
        indexes = [
            models.Index(fields=["company"]),
            models.Index(fields=["origem"]),
            models.Index(fields=["-publicado_em"]),
        ]

    def __str__(self) -> str:
        return self.titulo

    @property
    def nome_autor(self) -> str:
        """Nome a exibir como autor: empresa ou a conta oficial."""
        if self.origem == self.ORIGEM_IA:
            return "Por ELAS"
        return self.company.nome if self.company else "Por ELAS"
