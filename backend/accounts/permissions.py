"""
Permissões DRF — Por ELAS finance.
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class PerfilCompleto(permissions.BasePermission):
    """Exige usuária autenticada com username definido.

    Quando falta o username, lança 403 com código `username_requerido` para o
    frontend redirecionar à tela "Escolha seu nome de usuário".
    """

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated):
            return False
        if not getattr(user, "profile", None) or not user.profile.tem_username:
            raise PermissionDenied(
                detail={"code": "username_requerido", "detail": "Escolha um nome de usuário."}
            )
        return True
