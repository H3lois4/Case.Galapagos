"""
Modelos de carreira — Por ELAS finance.

Áreas do mercado financeiro (conteúdo de seed editável) e o plano de carreira
da usuária, gerado pela IA e acompanhado como checklist no perfil.
"""

from django.db import models


class Area(models.Model):
    slug = models.SlugField(max_length=80, unique=True)
    nome = models.CharField(max_length=120)
    resumo = models.CharField(max_length=240)
    descricao = models.TextField(blank=True)
    formacao = models.TextField(blank=True)
    certificacoes = models.JSONField(default=list, blank=True)  # ["CPA-20", ...]
    hard_skills = models.JSONField(default=list, blank=True)
    soft_skills = models.JSONField(default=list, blank=True)
    cargos_entrada = models.JSONField(default=list, blank=True)
    mulheres = models.JSONField(default=list, blank=True)  # [{"nome","cargo","linkedin"}]
    ordem = models.PositiveIntegerField(default=0)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Área"
        verbose_name_plural = "Áreas"
        ordering = ["ordem", "nome"]

    def __str__(self) -> str:
        return self.nome


class CareerPlan(models.Model):
    profile = models.OneToOneField(
        "accounts.Profile", on_delete=models.CASCADE, related_name="plano_carreira"
    )
    titulo = models.CharField(max_length=160, blank=True)
    # [{"id": int, "titulo": str, "descricao": str, "prazo": str, "concluido": bool}]
    passos = models.JSONField(default=list, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plano de carreira"
        verbose_name_plural = "Planos de carreira"
        ordering = ["-atualizado_em"]

    def __str__(self) -> str:
        return self.titulo or f"Plano de {self.profile}"

    @property
    def total_passos(self) -> int:
        return len(self.passos or [])

    @property
    def concluidos(self) -> int:
        return sum(1 for p in (self.passos or []) if p.get("concluido"))
