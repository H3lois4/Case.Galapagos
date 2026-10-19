"""
Serviços de domínio — verificação de empresa (Por ELAS finance).
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.text import slugify

from .models import Company, EmailVerification, Profile

CODIGO_VALIDADE = timedelta(minutes=15)


def dominio_do_email(email: str) -> str:
    return email.split("@")[-1].strip().lower()


def dominio_gratuito(email: str) -> bool:
    return dominio_do_email(email) in settings.DOMINIOS_EMAIL_GRATUITOS


def gerar_codigo() -> str:
    """Código numérico de 6 dígitos."""
    return f"{secrets.randbelow(1_000_000):06d}"


def criar_verificacao(profile: Profile, dados: dict) -> EmailVerification:
    """Cria o registro de verificação, gera o código e envia por e-mail."""
    codigo = gerar_codigo()
    verificacao = EmailVerification.objects.create(
        profile=profile,
        email_corporativo=dados["email_corporativo"].strip().lower(),
        nome_empresa=dados["nome_empresa"].strip(),
        site=dados.get("site", ""),
        cnpj=dados.get("cnpj", ""),
        codigo_hash=make_password(codigo),
        expira_em=timezone.now() + CODIGO_VALIDADE,
    )
    _enviar_codigo(verificacao, codigo)
    return verificacao


def reenviar_codigo(verificacao: EmailVerification) -> EmailVerification:
    """Gera um novo código para a mesma verificação e reenvia."""
    codigo = gerar_codigo()
    verificacao.codigo_hash = make_password(codigo)
    verificacao.tentativas = 0
    verificacao.expira_em = timezone.now() + CODIGO_VALIDADE
    verificacao.consumido_em = None
    verificacao.save(
        update_fields=["codigo_hash", "tentativas", "expira_em", "consumido_em"]
    )
    _enviar_codigo(verificacao, codigo)
    return verificacao


def _enviar_codigo(verificacao: EmailVerification, codigo: str) -> None:
    assunto = "Seu código de verificação — Por ELAS finance"
    corpo = (
        f"Olá!\n\n"
        f"Seu código para verificar a empresa {verificacao.nome_empresa} é:\n\n"
        f"    {codigo}\n\n"
        f"Ele expira em 15 minutos. Se não foi você, ignore este e-mail.\n\n"
        f"Com carinho,\nEquipe Por ELAS finance"
    )
    send_mail(
        assunto,
        corpo,
        settings.DEFAULT_FROM_EMAIL,
        [verificacao.email_corporativo],
        fail_silently=False,
    )


def confirmar_codigo(verificacao: EmailVerification, codigo: str) -> tuple[bool, str]:
    """Valida o código. Retorna (ok, mensagem_de_erro)."""
    if verificacao.consumido_em:
        return False, "Este código já foi usado."
    if verificacao.expirado:
        return False, "Código expirado. Peça um novo."
    if verificacao.esgotado:
        return False, "Número de tentativas excedido. Peça um novo código."

    if not check_password(codigo, verificacao.codigo_hash):
        verificacao.tentativas += 1
        verificacao.save(update_fields=["tentativas"])
        restantes = EmailVerification.MAX_TENTATIVAS - verificacao.tentativas
        return False, f"Código incorreto. Tentativas restantes: {max(restantes, 0)}."

    verificacao.consumido_em = timezone.now()
    verificacao.save(update_fields=["consumido_em"])
    return True, ""


def vincular_empresa(verificacao: EmailVerification) -> Company:
    """Cria/vincula a Company ao perfil após a confirmação do código.

    Domínios pré-aprovados ficam `aprovada` automaticamente; os demais, `pendente`.
    Várias usuárias do mesmo domínio compartilham a mesma Company.
    """
    dominio = dominio_do_email(verificacao.email_corporativo)
    pre_aprovado = dominio in settings.DOMINIOS_PRE_APROVADOS

    company = Company.objects.filter(dominio=dominio).first()
    if company is None:
        company = Company.objects.create(
            nome=verificacao.nome_empresa,
            slug=_slug_unico(verificacao.nome_empresa),
            site=verificacao.site,
            cnpj=verificacao.cnpj,
            dominio=dominio,
            status=Company.STATUS_APROVADA if pre_aprovado else Company.STATUS_PENDENTE,
        )
    elif pre_aprovado and company.status != Company.STATUS_APROVADA:
        company.status = Company.STATUS_APROVADA
        company.save(update_fields=["status"])

    profile = verificacao.profile
    profile.company = company
    profile.account_type = Profile.TIPO_EMPRESA
    profile.save(update_fields=["company", "account_type"])
    return company


def _slug_unico(nome: str) -> str:
    base = slugify(nome)[:160] or "empresa"
    slug = base
    i = 2
    while Company.objects.filter(slug=slug).exists():
        slug = f"{base}-{i}"
        i += 1
    return slug
