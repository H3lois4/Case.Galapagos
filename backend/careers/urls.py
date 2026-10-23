"""
URLs de carreira — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("carreira/areas/", views.AreasView.as_view(), name="carreira-areas"),
    path("carreira/areas/<slug:slug>/", views.AreaDetailView.as_view(), name="carreira-area"),
    path("carreira/plano/gerar/", views.GerarPlanoView.as_view(), name="carreira-plano-gerar"),
    path("carreira/plano/", views.PlanoView.as_view(), name="carreira-plano"),
    path("carreira/plano/passo/<int:passo_id>/", views.PlanoPassoView.as_view(), name="carreira-plano-passo"),
]
