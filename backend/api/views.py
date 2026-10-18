"""
Views técnicas da API — Por ELAS finance.
"""

from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Checagem de saúde que também toca o banco.

    Usada por monitoramento e por uma Vercel Cron diária para manter o
    projeto Supabase (plano free) ativo.
    """
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        db_ok = False

    payload = {
        "status": "ok" if db_ok else "degraded",
        "db": "ok" if db_ok else "error",
        "time": timezone.now().isoformat(),
    }
    return Response(payload, status=200 if db_ok else 503)
