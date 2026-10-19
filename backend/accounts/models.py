"""
Modelos de contas — Por ELAS finance.

A autenticação é do Supabase; aqui ficam o perfil local (ligado ao `sub` do
Supabase), as empresas, a verificação por e-mail corporativo e o grafo de
"seguir". O Django não guarda senhas.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class Company(models.Model):
    STATUS_PENDENTE = "pendente"
    STATUS_APROVADA = "aprovada"
    STATUS_REJEITADA = "rejeitada"
    STATUS_CHOICES = [
        (STATUS_PENDENTE, "Pendente"),
        (STATUS_APROVADA, "Aprovada"),
        (STATUS_REJEITADA, "Rejeitada"),
    ]

    nome = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True)
    logo = models.URLField(blank=True)  # URL no R2 (etapas futuras)
    descricao = models.TextField(blank=True)
    site = models.URLField(blank=True)
    cnpj = models.CharField(max_length=18, blank=True)
    dominio = models.CharField(max_length=120, blank=True, db_index=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDENTE
    )
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nome"]

    def __str__(self) -> str:
        return f"{self.nome} ({self.status})"

    @property
    def aprovada(self) -> bool:
        return self.status == self.STATUS_APROVADA


class Profile(models.Model):
    TIPO_PESSOAL = "pessoal"
    TIPO_EMPRESA = "empresa"
    TIPO_CHOICES = [
        (TIPO_PESSOAL, "Pessoal"),
        (TIPO_EMPRESA, "Empresa"),
    ]

    # Vínculo com o Supabase Auth
    supabase_sub = models.CharField(max_length=64, unique=True, db_index=True)
    email = models.EmailField()

    # Identidade pública
    username = models.CharField(max_length=30, unique=True, null=True, blank=True)
    # Cópia em minúsculas para unicidade case-insensitive portável (SQLite/Postgres)
    username_ci = models.CharField(
        max_length=30, unique=True, null=True, blank=True, editable=False
    )

    account_type = models.CharField(
        max_length=10, choices=TIPO_CHOICES, default=TIPO_PESSOAL
    )
    company = models.ForeignKey(
        Company,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="membros",
    )

    nome_exibicao = models.CharField(max_length=80, blank=True)
    foto = models.URLField(blank=True)
    descricao = models.CharField(max_length=200, blank=True)
    linkedin = models.URLField(blank=True)

    termos_aceitos_em = models.DateTimeField(null=True, blank=True)
    termos_versao = models.CharField(max_length=20, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfis"
        ordering = ["-criado_em"]

    def save(self, *args, **kwargs):
        # Mantém username_ci sincronizado para garantir unicidade case-insensitive.
        self.username_ci = self.username.lower() if self.username else None
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.username or f"(sem username) {self.email}"

    @property
    def empresa_aprovada(self) -> bool:
        return bool(self.company and self.company.aprovada)

    @property
    def tem_username(self) -> bool:
        return bool(self.username)

    @property
    def total_seguidores(self) -> int:
        return self.seguidores_set.count()

    @property
    def total_seguindo(self) -> int:
        return self.seguindo_set.count()


class EmailVerification(models.Model):
    """Verificação de e-mail corporativo para contas de empresa."""

    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="verificacoes"
    )
    email_corporativo = models.EmailField()
    nome_empresa = models.CharField(max_length=160)
    site = models.URLField(blank=True)
    cnpj = models.CharField(max_length=18, blank=True)

    codigo_hash = models.CharField(max_length=128)
    tentativas = models.PositiveSmallIntegerField(default=0)
    expira_em = models.DateTimeField()
    consumido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    MAX_TENTATIVAS = 5

    class Meta:
        verbose_name = "Verificação de empresa"
        verbose_name_plural = "Verificações de empresa"
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        return f"{self.email_corporativo} ({'ok' if self.consumido_em else 'pendente'})"

    @property
    def expirado(self) -> bool:
        return timezone.now() >= self.expira_em

    @property
    def esgotado(self) -> bool:
        return self.tentativas >= self.MAX_TENTATIVAS

    @property
    def utilizavel(self) -> bool:
        return not (self.consumido_em or self.expirado or self.esgotado)


class Follow(models.Model):
    """Relação de seguir: uma usuária segue outra usuária OU uma empresa."""

    seguidor = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="seguindo_set"
    )
    seguido_profile = models.ForeignKey(
        Profile,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="seguidores_set",
    )
    seguido_company = models.ForeignKey(
        Company,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="seguidores_set",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Seguir"
        verbose_name_plural = "Seguindo"
        constraints = [
            models.UniqueConstraint(
                fields=["seguidor", "seguido_profile"],
                name="unique_follow_profile",
            ),
            models.UniqueConstraint(
                fields=["seguidor", "seguido_company"],
                name="unique_follow_company",
            ),
            # Não pode seguir a si mesma
            models.CheckConstraint(
                check=~models.Q(seguidor=models.F("seguido_profile")),
                name="nao_seguir_a_si_mesma",
            ),
        ]

    def __str__(self) -> str:
        alvo = self.seguido_profile or self.seguido_company
        return f"{self.seguidor} → {alvo}"
