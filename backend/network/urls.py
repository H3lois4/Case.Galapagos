"""
URLs da Rede — Por ELAS finance.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("rede/posts/", views.PostsView.as_view(), name="rede-posts"),
    path("rede/posts/<int:pk>/", views.PostDetailView.as_view(), name="rede-post"),
    path("rede/posts/<int:pk>/curtir/", views.CurtirView.as_view(), name="rede-curtir"),
    path(
        "rede/posts/<int:pk>/comentarios/",
        views.ComentariosView.as_view(),
        name="rede-comentarios",
    ),
    path(
        "rede/comentarios/<int:pk>/",
        views.ComentarioDetailView.as_view(),
        name="rede-comentario",
    ),
    path("rede/noticias/", views.NoticiasView.as_view(), name="rede-noticias"),
    # Job da IA de notícias (Vercel Cron)
    path("ai/news/run/", views.NewsRunView.as_view(), name="ai-news-run"),
]
