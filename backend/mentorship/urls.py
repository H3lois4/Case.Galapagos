"""
URLs de mentoria — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("mentoria/horarios/", views.HorariosView.as_view(), name="mentoria-horarios"),
    path("mentoria/horarios/meus/", views.MeusHorariosView.as_view(), name="mentoria-meus-horarios"),
    path("mentoria/horarios/<int:pk>/", views.HorarioDetailView.as_view(), name="mentoria-horario"),
    path("mentoria/horarios/<int:pk>/agendar/", views.AgendarView.as_view(), name="mentoria-agendar"),
    path("mentoria/minhas/", views.MinhasView.as_view(), name="mentoria-minhas"),
    path("mentoria/minhas/<int:pk>/cancelar/", views.CancelarView.as_view(), name="mentoria-cancelar"),
]
