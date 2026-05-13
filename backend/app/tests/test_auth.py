"""
Tests for JWT auth utilities and auth endpoints.
All tests use SQLite in-memory (no external services required).
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from jose import jwt

from app.auth import (
    hash_password, verify_password, create_access_token, _decode_token
)
from app.config import settings


# ── Password hashing ───────────────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        h = hash_password("secret123")
        assert h != "secret123"
        assert len(h) > 20

    def test_verify_correct_password(self):
        h = hash_password("correct_horse")
        assert verify_password("correct_horse", h) is True

    def test_verify_wrong_password(self):
        h = hash_password("correct_horse")
        assert verify_password("wrong_horse", h) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # bcrypt salted

    def test_verify_empty_string(self):
        h = hash_password("")
        assert verify_password("", h) is True
        assert verify_password("notempty", h) is False


# ── JWT creation and decoding ──────────────────────────────────────────────────

class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token("user-123", "test@example.com")
        payload = _decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"

    def test_token_has_expiry(self):
        token = create_access_token("user-1", "a@b.com")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert "exp" in payload
        exp_dt = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp_dt > datetime.now(timezone.utc)

    def test_expired_token_raises(self):
        from fastapi import HTTPException
        # Create token that expired 1 hour ago
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {"sub": "user-1", "email": "a@b.com", "exp": expire}
        token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        with pytest.raises(HTTPException) as exc_info:
            _decode_token(token)
        assert exc_info.value.status_code == 401

    def test_invalid_token_raises(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            _decode_token("not.a.valid.jwt")
        assert exc_info.value.status_code == 401

    def test_wrong_secret_raises(self):
        from fastapi import HTTPException
        token = jwt.encode({"sub": "u", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                          "wrong-secret", algorithm="HS256")
        with pytest.raises(HTTPException):
            _decode_token(token)

    def test_token_type(self):
        token = create_access_token("u", "e@e.com")
        assert isinstance(token, str)
        assert token.count('.') == 2  # JWT has 3 parts


# ── Auth endpoint structural tests ────────────────────────────────────────────

class TestAuthEndpoints:
    """Structural tests for auth endpoints — no DB connection required."""

    def test_router_has_register_route(self):
        from app.api.auth import router
        paths = {r.path for r in router.routes}
        assert any("register" in p for p in paths)

    def test_router_has_login_route(self):
        from app.api.auth import router
        paths = {r.path for r in router.routes}
        assert any("login" in p for p in paths)

    def test_router_has_me_route(self):
        from app.api.auth import router
        paths = {r.path for r in router.routes}
        assert any("me" in p for p in paths)

    def test_register_request_model_has_email(self):
        from app.api.auth import RegisterRequest
        fields = RegisterRequest.model_fields
        assert "email" in fields

    def test_register_request_model_has_password(self):
        from app.api.auth import RegisterRequest
        fields = RegisterRequest.model_fields
        assert "password" in fields

    def test_token_response_model_has_access_token(self):
        from app.api.auth import TokenResponse
        fields = TokenResponse.model_fields
        assert "access_token" in fields
        assert "token_type" in fields

    @pytest.mark.integration
    def test_me_without_token_returns_401(self):
        """Requires running database. Mark with -m integration to run."""
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_me_with_invalid_token_returns_401(self):
        """Requires running database. Mark with -m integration to run."""
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401
