"""
Autenticação do Supabase no Django (resource server).

Valida o JWT emitido pelo Supabase Auth usando as chaves públicas (JWKS) do
projeto, sem armazenar senhas. No primeiro request de uma usuária nova, cria
o Profile local (provisionamento JIT) ligado ao `sub` do Supabase.
"""

import time

import jwt
import requests
from django.conf import settings
from jwt import PyJWKClient
from rest_framework import authentication, exceptions

from .models import Profile


class ProfileUser:
    """Usuária autenticada, baseada no Profile local (não no auth.User)."""

    def __init__(self, profile: Profile):
        self.profile = profile

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def pk(self):
        return self.profile.pk

    def __str__(self) -> str:
        return str(self.profile)


class _JWKSCache:
    """Cache simples do PyJWKClient por TTL, para não buscar o JWKS a cada request."""

    _client: PyJWKClient | None = None
    _buscado_em: float = 0.0

    @classmethod
    def get_client(cls) -> PyJWKClient:
        ttl = int(getattr(settings, "SUPABASE_JWKS_TTL", 600))
        agora = time.monotonic()
        if cls._client is None or (agora - cls._buscado_em) > ttl:
            url = f"{settings.SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"
            cls._client = PyJWKClient(url, cache_keys=True)
            cls._buscado_em = agora
        return cls._client

    @classmethod
    def reset(cls) -> None:
        cls._client = None
        cls._buscado_em = 0.0


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """DRF authentication class que valida o access_token do Supabase."""

    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None  # sem header → deixa outras classes/anônimo decidirem
        partes = header.split()
        if partes[0].lower() != self.keyword.lower():
            return None
        if len(partes) != 2:
            raise exceptions.AuthenticationFailed("Cabeçalho Authorization inválido.")

        token = partes[1]
        payload = self._decode(token)

        sub = payload.get("sub")
        email = payload.get("email", "") or ""
        if not sub:
            raise exceptions.AuthenticationFailed("Token sem identificador (sub).")

        profile = self._get_or_create_profile(sub, email)
        return (ProfileUser(profile), token)

    def _decode(self, token: str) -> dict:
        aud = getattr(settings, "SUPABASE_JWT_AUD", "authenticated")
        issuer = f"{settings.SUPABASE_PROJECT_URL}/auth/v1"
        try:
            signing_key = _JWKSCache.get_client().get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience=aud,
                issuer=issuer,
                options={"require": ["exp", "sub"]},
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expirado.")
        except (jwt.InvalidTokenError, jwt.PyJWKClientError) as exc:
            # Pode ser um kid novo após rotação de chave: zera o cache e tenta 1x.
            _JWKSCache.reset()
            try:
                signing_key = _JWKSCache.get_client().get_signing_key_from_jwt(token)
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience=aud,
                    issuer=issuer,
                    options={"require": ["exp", "sub"]},
                )
            except Exception:
                raise exceptions.AuthenticationFailed(f"Token inválido: {exc}")
        except requests.RequestException:
            raise exceptions.AuthenticationFailed("Não foi possível validar o token.")

    def _get_or_create_profile(self, sub: str, email: str) -> Profile:
        profile, criado = Profile.objects.get_or_create(
            supabase_sub=sub,
            defaults={"email": email},
        )
        # Mantém o e-mail atualizado se mudou no Supabase.
        if email and profile.email != email:
            profile.email = email
            profile.save(update_fields=["email"])
        return profile

    def authenticate_header(self, request):
        return self.keyword
