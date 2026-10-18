"""
WSGI config do projeto — Por ELAS finance (por-elas-api).

Expõe a callable WSGI como ``application``. A Vercel procura uma variável
``app`` ou ``application`` no módulo apontado pelo build, então expomos as duas.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()

# Alias para o runtime Python da Vercel.
app = application
