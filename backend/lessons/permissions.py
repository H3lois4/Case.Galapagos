"""
Permissões DRF — aulas (Por ELAS finance).
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class EmpresaAprovada(permissions.BasePermission):
    """Exige usuária autenticada vinculada a uma empresa aprovada.

    Usada para gerar URL de upload e criar aulas. Lança 403 com código
    `empresa_requerida` para o frontend orientar a verificação de empresa.
    """

    message = "Apenas empresas aprovadas podem publicar aulas."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, "profile", None)
        if not profile or not profile.empresa_aprovada:
            raise PermissionDenied(
                detail={
                    "code": "empresa_requerida",
                    "detail": self.message,
                }
            )
        return True
