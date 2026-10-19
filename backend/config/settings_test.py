"""
Settings de teste — força SQLite em memória, ignorando o DATABASE_URL do .env.

Uso: python manage.py test --settings=config.settings_test
"""

import os

# Garante que o loader de .env/settings não use o Postgres de produção.
os.environ["DATABASE_URL"] = ""

from config.settings import *  # noqa: E402,F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# E-mail em memória para inspecionar nos testes.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
