"""
URLs de aulas — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("aulas/", views.AulasView.as_view(), name="aulas"),
    path("aulas/empresas/", views.EmpresasComAulasView.as_view(), name="aulas-empresas"),
    path("aulas/upload-url/", views.UploadUrlView.as_view(), name="aulas-upload-url"),
    path("aulas/<int:pk>/", views.AulaDetailView.as_view(), name="aula-detalhe"),
]
