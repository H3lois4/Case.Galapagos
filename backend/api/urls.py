"""
URLs da API — Por ELAS finance.

As rotas de cada domínio (accounts, lessons, ...) serão incluídas aqui
conforme as próximas etapas forem construídas.
"""

from django.urls import include, path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("", include("accounts.urls")),
    path("", include("lessons.urls")),
    path("", include("ai.urls")),
    path("", include("careers.urls")),
]
