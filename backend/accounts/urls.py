"""
URLs de contas e perfis — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    # Perfil da própria usuária
    path("me/", views.MeView.as_view(), name="me"),
    path("me/username/", views.UsernameView.as_view(), name="me-username"),
    path(
        "me/username-disponivel/",
        views.UsernameDisponivelView.as_view(),
        name="me-username-disponivel",
    ),
    path("me/aceite-termos/", views.AceiteTermosView.as_view(), name="me-termos"),
    path("me/tipo-conta/", views.TipoContaView.as_view(), name="me-tipo-conta"),
    # Verificação de empresa
    path("empresa/verificar/", views.EmpresaVerificarView.as_view(), name="empresa-verificar"),
    path("empresa/confirmar/", views.EmpresaConfirmarView.as_view(), name="empresa-confirmar"),
    path("empresa/reenviar/", views.EmpresaReenviarView.as_view(), name="empresa-reenviar"),
    # Perfil público e seguir
    path("u/<str:username>/", views.PerfilPublicoView.as_view(), name="perfil-publico"),
    path("u/<str:username>/seguir/", views.SeguirView.as_view(), name="seguir"),
]
