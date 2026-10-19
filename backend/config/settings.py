"""
Configurações do projeto Django — Por ELAS finance (por-elas-api).

Roda serverless na Vercel. Lê tudo que é sensível de variáveis de ambiente.
Em desenvolvimento, sem DATABASE_URL, cai para SQLite.
"""

import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def _carregar_env_local() -> None:
    """Carrega backend/.env para os.environ em desenvolvimento.

    Leve e sem dependência externa. Em produção (Vercel), as variáveis já
    chegam pelo ambiente, então o arquivo não existe e nada acontece.
    Não sobrescreve variáveis já definidas no ambiente.
    """
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for linha in env_path.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, _, valor = linha.partition("=")
        chave = chave.strip()
        valor = valor.strip().strip('"').strip("'")
        os.environ.setdefault(chave, valor)


_carregar_env_local()


def env_bool(name: str, default: bool = False) -> bool:
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Básico
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-troque-em-producao",
)

DEBUG = env_bool("DJANGO_DEBUG", default=True)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
# A Vercel expõe o host de produção dinamicamente; aceitar os domínios .vercel.app.
if not DEBUG:
    ALLOWED_HOSTS += [".vercel.app"]

# Segredo compartilhado para endpoints chamados pela Vercel Cron (usado em etapas futuras).
CRON_SECRET = os.environ.get("CRON_SECRET", "")


# ---------------------------------------------------------------------------
# Apps
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceiros
    "rest_framework",
    "corsheaders",
    # App técnico
    "api",
    # Apps de domínio
    "accounts",
    "lessons",
    "careers",
    "mentorship",
    "practice",
    "network",
    "ai",
    "seed",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ---------------------------------------------------------------------------
# Banco de dados
# ---------------------------------------------------------------------------
# Em produção: Postgres do Supabase pelo pooler em modo transação (porta 6543).
# Por ser serverless, não reaproveitar conexões (CONN_MAX_AGE=0) e desligar
# cursores do lado do servidor (incompatíveis com o pooler em modo transação).
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=0,
            ssl_require=not DEBUG,
        )
    }
    DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
else:
    # Fallback de desenvolvimento, sem Supabase.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ---------------------------------------------------------------------------
# Validação de senha (relevante apenas para o superuser do Admin;
# a autenticação das usuárias é feita pelo Supabase Auth)
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# Internacionalização
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Arquivos estáticos (servidos por WhiteNoise, inclusive os do Admin)
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.SupabaseJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

if not DEBUG:
    # DRF Browsable API só em desenvolvimento.
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
        "rest_framework.renderers.JSONRenderer",
    ]
else:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
        "rest_framework.renderers.BrowsableAPIRenderer"
    )


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# A API usa token Bearer (não depende de cookie/sessão fora do Admin).
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
)
# Permitir previews da Vercel (*.vercel.app) via regex, além das origens fixas.
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.vercel\.app$"]


# ---------------------------------------------------------------------------
# Segurança em produção
# ---------------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    CSRF_TRUSTED_ORIGINS = env_list(
        "CSRF_TRUSTED_ORIGINS", "https://*.vercel.app"
    )


# ---------------------------------------------------------------------------
# Supabase Auth (validação do JWT)
# ---------------------------------------------------------------------------
SUPABASE_PROJECT_URL = os.environ.get("SUPABASE_PROJECT_URL", "").rstrip("/")
SUPABASE_JWT_AUD = os.environ.get("SUPABASE_JWT_AUD", "authenticated")
SUPABASE_JWKS_TTL = int(os.environ.get("SUPABASE_JWKS_TTL", "600"))


# ---------------------------------------------------------------------------
# E-mail transacional (mesmo SMTP configurado no Supabase)
# ---------------------------------------------------------------------------
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", "Por ELAS finance <no-reply@porelas.app>"
)
if EMAIL_HOST:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    # Sem SMTP configurado, imprime o e-mail no console (útil em dev).
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# ---------------------------------------------------------------------------
# Regras de verificação de empresa
# ---------------------------------------------------------------------------
TERMOS_VERSAO = os.environ.get("TERMOS_VERSAO", "1.0")

DOMINIOS_PRE_APROVADOS = [
    d.lower() for d in env_list("DOMINIOS_PRE_APROVADOS", "galapagoscapital.com")
]

# Domínios de e-mail gratuitos bloqueados no cadastro de empresa.
DOMINIOS_EMAIL_GRATUITOS = {
    "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "live.com",
    "msn.com", "yahoo.com", "yahoo.com.br", "ymail.com", "icloud.com", "me.com",
    "bol.com.br", "uol.com.br", "terra.com.br", "ig.com.br", "globo.com",
    "globomail.com", "zipmail.com.br", "aol.com", "proton.me", "protonmail.com",
    "gmx.com", "yandex.com", "mail.com",
}
