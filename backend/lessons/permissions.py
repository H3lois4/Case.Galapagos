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


class PodePublicarAula(permissions.BasePermission):
    """Permite publicar aulas a administradoras OU a empresas aprovadas.

    A administradora (equipe Por ELAS) pode publicar como "Por ELAS" ou como a
    empresa que representa (Galapagos). Empresas aprovadas publicam em seu nome.
    """

    message = "Apenas empresas aprovadas podem publicar aulas."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated):
            return False
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        if profile.is_admin or profile.empresa_aprovada:
            return True
        raise PermissionDenied(
            detail={
                "code": "empresa_requerida",
                "detail": self.message,
            }
        )
