"""
URLs da IA — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("ai/agentes/", views.AgentesView.as_view(), name="ai-agentes"),
    path("ai/conversas/", views.ConversasView.as_view(), name="ai-conversas"),
    path("ai/conversas/<int:pk>/", views.ConversaDetailView.as_view(), name="ai-conversa"),
    path("ai/conversas/<int:pk>/resumo/", views.ResumoView.as_view(), name="ai-resumo"),
    path("ai/chat/", views.ChatView.as_view(), name="ai-chat"),
    path("ai/mensagens/<int:pk>/feedback/", views.FeedbackView.as_view(), name="ai-feedback"),
]
