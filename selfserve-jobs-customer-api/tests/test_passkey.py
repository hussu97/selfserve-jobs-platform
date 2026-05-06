"""Tests for passkey endpoints.

WebAuthn verification is mocked because it requires a real browser/authenticator flow.
We test:
  - register/begin: creates a challenge and returns options
  - register/complete: verifies credential and saves passkey
  - auth/begin: returns options for known email, 404 for unknown
  - auth/complete: verifies credential and returns session
  - GET /passkey/: lists passkeys for authenticated user
  - DELETE /passkey/{id}: removes a passkey
  - /auth/begin/admin and /auth/complete/admin: admin-only guard
"""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.dependencies import get_session
from app.main import app
from app.models.auth_session import AuthSession
from app.models.passkey import Passkey
from app.services.code_generator import generate_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db(db_engine):
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


async def _make_session(db: AsyncSession, email: str, user_type: str | None = None) -> str:
    from datetime import UTC, datetime, timedelta

    token = generate_token(64)
    session = AuthSession(
        session_token=token,
        email=email,
        user_type=user_type,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db.add(session)
    await db.commit()
    return token


async def _make_passkey(db: AsyncSession, email: str, label: str | None = None) -> Passkey:
    from datetime import UTC, datetime

    passkey = Passkey(
        credential_id=b"\x01" * 32,
        public_key=b"\x02" * 64,
        sign_count=0,
        user_email=email,
        label=label,
        created_at=datetime.now(UTC),
    )
    db.add(passkey)
    await db.commit()
    await db.refresh(passkey)
    return passkey


@pytest.fixture
async def client(db):
    async def override_get_session():
        yield db

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# register/begin
# ---------------------------------------------------------------------------


async def test_register_begin_requires_auth(client):
    r = await client.get("/api/v1/passkey/register/begin")
    assert r.status_code == 401


async def test_register_begin_returns_options(client, db):
    token = await _make_session(db, "user@test.com")
    r = await client.get(
        "/api/v1/passkey/register/begin",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "session_key" in body
    assert "options" in body
    assert "challenge" in body["options"]


# ---------------------------------------------------------------------------
# register/complete
# ---------------------------------------------------------------------------


async def test_register_complete_saves_passkey(client, db):
    token = await _make_session(db, "user@test.com")

    # Get a real challenge first
    r = await client.get(
        "/api/v1/passkey/register/begin",
        headers={"Authorization": f"Bearer {token}"},
    )
    session_key = r.json()["session_key"]

    fake_verification = MagicMock()
    fake_verification.credential_id = b"\xab\xcd" * 16
    fake_verification.credential_public_key = b"\xef" * 64
    fake_verification.sign_count = 0
    fake_verification.aaguid = "00000000-0000-0000-0000-000000000000"

    with patch("app.services.passkey_service.webauthn.verify_registration_response", return_value=fake_verification):
        r = await client.post(
            "/api/v1/passkey/register/complete",
            json={
                "session_key": session_key,
                "credential": {
                    "id": "abc",
                    "rawId": "abc",
                    "response": {"clientDataJSON": "abc", "attestationObject": "abc"},
                },
                "label": "Test key",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    assert r.json()["message"] == "Passkey registered successfully"


async def test_register_complete_bad_session_key(client, db):
    token = await _make_session(db, "user@test.com")
    r = await client.post(
        "/api/v1/passkey/register/complete",
        json={"session_key": "nonexistent" * 6, "credential": {}, "label": None},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# auth/begin
# ---------------------------------------------------------------------------


async def test_auth_begin_returns_options(client, db):
    await _make_passkey(db, "user@test.com")
    r = await client.post("/api/v1/passkey/auth/begin", json={"email": "user@test.com"})
    assert r.status_code == 200
    body = r.json()
    assert "session_key" in body
    assert "options" in body


async def test_auth_begin_unknown_email_returns_404(client, db):
    r = await client.post("/api/v1/passkey/auth/begin", json={"email": "nobody@test.com"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# auth/complete
# ---------------------------------------------------------------------------


async def test_auth_complete_returns_session(client, db):
    await _make_passkey(db, "user@test.com")

    r = await client.post("/api/v1/passkey/auth/begin", json={"email": "user@test.com"})
    session_key = r.json()["session_key"]

    fake_verification = MagicMock()
    fake_verification.new_sign_count = 1

    with patch("app.services.passkey_service.webauthn.verify_authentication_response", return_value=fake_verification):
        r = await client.post(
            "/api/v1/passkey/auth/complete",
            json={
                "session_key": session_key,
                "credential": {
                    "id": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE",
                    "rawId": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE",
                    "response": {
                        "clientDataJSON": "abc",
                        "authenticatorData": "abc",
                        "signature": "abc",
                    },
                },
            },
        )
    assert r.status_code == 200
    body = r.json()
    assert "session_token" in body
    assert body["email"] == "user@test.com"


async def test_auth_complete_bad_session_key(client):
    r = await client.post(
        "/api/v1/passkey/auth/complete",
        json={"session_key": "bad" * 22, "credential": {}},
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# list and delete
# ---------------------------------------------------------------------------


async def test_list_passkeys_empty(client, db):
    token = await _make_session(db, "nokey@test.com")
    r = await client.get("/api/v1/passkey/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["items"] == []


async def test_list_passkeys_returns_items(client, db):
    await _make_passkey(db, "lister@test.com", label="My phone")
    token = await _make_session(db, "lister@test.com")
    r = await client.get("/api/v1/passkey/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["label"] == "My phone"
    assert "credential_id_b64" in items[0]


async def test_delete_passkey(client, db):
    passkey = await _make_passkey(db, "del@test.com")
    from webauthn.helpers import bytes_to_base64url

    cid_b64 = bytes_to_base64url(passkey.credential_id)
    token = await _make_session(db, "del@test.com")
    r = await client.delete(f"/api/v1/passkey/{cid_b64}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    # Verify gone
    r2 = await client.get("/api/v1/passkey/", headers={"Authorization": f"Bearer {token}"})
    assert r2.json()["items"] == []


async def test_delete_passkey_wrong_user(client, db):
    passkey = await _make_passkey(db, "owner@test.com")
    from webauthn.helpers import bytes_to_base64url

    cid_b64 = bytes_to_base64url(passkey.credential_id)
    token = await _make_session(db, "other@test.com")
    r = await client.delete(f"/api/v1/passkey/{cid_b64}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# admin-specific endpoints
# ---------------------------------------------------------------------------


async def test_admin_auth_begin_rejects_non_admin(client, db):
    await _make_passkey(db, "user@test.com")
    r = await client.post("/api/v1/passkey/auth/begin/admin", json={"email": "user@test.com"})
    assert r.status_code == 403


async def test_admin_auth_complete_rejects_non_admin_session(client, db):
    await _make_passkey(db, "user@test.com")

    # Begin with regular auth endpoint (bypass admin guard)
    r = await client.post("/api/v1/passkey/auth/begin", json={"email": "user@test.com"})
    session_key = r.json()["session_key"]

    fake_verification = MagicMock()
    fake_verification.new_sign_count = 1

    with patch("app.services.passkey_service.webauthn.verify_authentication_response", return_value=fake_verification):
        r = await client.post(
            "/api/v1/passkey/auth/complete/admin",
            json={
                "session_key": session_key,
                "credential": {
                    "id": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE",
                    "rawId": "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE",
                    "response": {
                        "clientDataJSON": "abc",
                        "authenticatorData": "abc",
                        "signature": "abc",
                    },
                },
            },
        )
    # user@test.com is not in admin_email_list, so session.user_type is None → 403
    assert r.status_code == 403
