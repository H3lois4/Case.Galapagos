"""
Modelos da Rede — Por ELAS finance.

Posts (comum, vaga, notícia), curtidas e comentários. Notícias da conta oficial
"Por ELAS" são geradas pela IA (origem_ia=True). Os contadores de curtidas e
comentários são desnormalizados para deixar o feed leve.
"""

from django.db import models


class Post(models.Model):
    TIPO_POST = "post"
    TIPO_VAGA = "vaga"
    TIPO_NOTICIA = "noticia"
    TIPO_CHOICES = [
        (TIPO_POST, "Post"),
        (TIPO_VAGA, "Vaga"),
        (TIPO_NOTICIA, "Notícia"),
    ]

    autor = models.ForeignKey(
        "accounts.Profile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="posts",
    )
    company = models.ForeignKey(
        "accounts.Company",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    # Notícia da conta oficial "Por ELAS" (gerada pela IA).
    origem_ia = models.BooleanField(default=False)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default=TIPO_POST, db_index=True)
    texto = models.TextField(blank=True)
    imagem_url = models.URLField(max_length=700, blank=True)
    imagem_key = models.CharField(max_length=512, blank=True)

    # Vaga
    vaga_cargo = models.CharField(max_length=160, blank=True)
    vaga_local = models.CharField(max_length=160, blank=True)  # local/modelo
    vaga_link = models.URLField(blank=True)

    # Notícia
    titulo = models.CharField(max_length=200, blank=True)
    categoria = models.CharField(max_length=40, blank=True)  # juros, bolsa, cambio, cripto, carreira
    fonte_url = models.URLField(max_length=700, blank=True)
    fonte_chave = models.CharField(max_length=300, blank=True, db_index=True)  # dedupe

    curtidas_count = models.PositiveIntegerField(default=0)
    comentarios_count = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["tipo", "-criado_em"]),
            models.Index(fields=["-criado_em"]),
        ]

    def __str__(self) -> str:
        return f"[{self.tipo}] {(self.titulo or self.texto)[:40]}"


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="curtidas")
    profile = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="curtidas"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Curtida"
        verbose_name_plural = "Curtidas"
        constraints = [
            models.UniqueConstraint(
                fields=["post", "profile"], name="uma_curtida_por_post"
            )
        ]

    def __str__(self) -> str:
        return f"{self.profile} ♥ post {self.post_id}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comentarios")
    autor = models.ForeignKey(
        "accounts.Profile", on_delete=models.CASCADE, related_name="comentarios"
    )
    texto = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Comentário"
        verbose_name_plural = "Comentários"
        ordering = ["criado_em"]

    def __str__(self) -> str:
        return f"{self.autor}: {self.texto[:40]}"
