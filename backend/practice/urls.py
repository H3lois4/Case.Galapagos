"""
URLs de prática — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("pratica/temas/", views.TemasView.as_view(), name="pratica-temas"),
    path("pratica/simulados/", views.SimuladoIniciarView.as_view(), name="pratica-simulado-iniciar"),
    path(
        "pratica/simulados/historico/",
        views.SimuladoHistoricoView.as_view(),
        name="pratica-simulado-historico",
    ),
    path(
        "pratica/simulados/<int:pk>/responder/",
        views.SimuladoResponderView.as_view(),
        name="pratica-simulado-responder",
    ),
    path(
        "pratica/simulados/<int:pk>/",
        views.SimuladoDetailView.as_view(),
        name="pratica-simulado-detalhe",
    ),
    path("pratica/entrevistas/", views.EntrevistaCriarView.as_view(), name="pratica-entrevista-criar"),
    path(
        "pratica/entrevistas/historico/",
        views.EntrevistaHistoricoView.as_view(),
        name="pratica-entrevista-historico",
    ),
    path(
        "pratica/entrevistas/<int:pk>/",
        views.EntrevistaDetailView.as_view(),
        name="pratica-entrevista",
    ),
    path(
        "pratica/entrevistas/<int:pk>/relatorio/",
        views.EntrevistaRelatorioView.as_view(),
        name="pratica-entrevista-relatorio",
    ),
]
