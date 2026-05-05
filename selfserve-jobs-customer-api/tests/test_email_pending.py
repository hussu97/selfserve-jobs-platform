"""Tests for email_pending queue: save-on-failure and flush-on-send retry logic."""

import time
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

# Import at module level so both tables are registered with Base.metadata
# before the db_engine fixture calls create_all.
from app.models.email_log import EmailLog  # noqa: F401
from app.models.email_pending import EmailPending

import app.services.email_service as email_svc
from app.services.email_service import _flush_pending_emails, _save_pending_email


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _reset_cb():
    """Reset in-process circuit-breaker state between tests."""
    email_svc._cb_consecutive_failures = 0
    email_svc._cb_open_since = None


async def _make_pending(
    db,
    *,
    email_type: str = "verification",
    recipient_email: str = "user@test.com",
    entity_type: str | None = "job",
    entity_code: str | None = "testjob0001",
    subject: str = "Verify your listing",
    html_body: str = "<p>Verify</p>",
    text_body: str = "Verify",
    attempt_count: int = 0,
    hours_ago: float = 1.0,
) -> EmailPending:
    pending = EmailPending(
        email_type=email_type,
        recipient_email=recipient_email,
        entity_type=entity_type,
        entity_code=entity_code,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        attempt_count=attempt_count,
        created_at=datetime.now(UTC) - timedelta(hours=hours_ago),
    )
    db.add(pending)
    await db.flush()
    return pending


# ---------------------------------------------------------------------------
# _save_pending_email
# ---------------------------------------------------------------------------


async def test_save_pending_email_creates_record(db_session):
    await _save_pending_email(
        db_session,
        email_type="verification",
        recipient_email="a@example.com",
        subject="Verify",
        html_body="<p>Verify</p>",
        text_body="Verify",
        entity_type="job",
        entity_code="job00000001",
    )

    result = await db_session.execute(select(EmailPending))
    rows = result.scalars().all()
    assert len(rows) == 1
    row = rows[0]
    assert row.email_type == "verification"
    assert row.recipient_email == "a@example.com"
    assert row.entity_type == "job"
    assert row.entity_code == "job00000001"
    assert row.subject == "Verify"
    assert row.html_body == "<p>Verify</p>"
    assert row.attempt_count == 0
    assert row.last_attempted_at is None


async def test_save_pending_email_no_entity(db_session):
    await _save_pending_email(
        db_session,
        email_type="login",
        recipient_email="b@example.com",
        subject="Login",
        html_body="<p>Login</p>",
        text_body="Login",
        entity_type=None,
        entity_code=None,
    )

    result = await db_session.execute(
        select(EmailPending).where(EmailPending.email_type == "login")
    )
    row = result.scalar_one()
    assert row.entity_type is None
    assert row.entity_code is None


# ---------------------------------------------------------------------------
# _flush_pending_emails
# ---------------------------------------------------------------------------


async def test_flush_removes_record_on_success(db_session):
    _reset_cb()
    await _make_pending(db_session)

    mock_send = MagicMock(return_value={"id": "resend-abc123"})
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    result = await db_session.execute(select(EmailPending))
    assert result.scalars().all() == []
    mock_send.assert_called_once()


async def test_flush_increments_attempt_count_on_failure(db_session):
    _reset_cb()
    await _make_pending(db_session, attempt_count=2)

    mock_send = MagicMock(side_effect=Exception("connection refused"))
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    result = await db_session.execute(select(EmailPending))
    rows = result.scalars().all()
    assert len(rows) == 1
    assert rows[0].attempt_count == 3
    assert rows[0].last_attempted_at is not None


async def test_flush_skips_records_older_than_24h(db_session):
    _reset_cb()
    await _make_pending(db_session, hours_ago=25)

    mock_send = MagicMock(return_value={"id": "resend-xyz"})
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    mock_send.assert_not_called()
    result = await db_session.execute(select(EmailPending))
    assert len(result.scalars().all()) == 1


async def test_flush_is_noop_when_queue_is_empty(db_session):
    _reset_cb()
    mock_send = MagicMock()
    with patch("resend.Emails.send", mock_send):
        await _flush_pending_emails(db_session)

    mock_send.assert_not_called()


async def test_flush_aborts_early_when_circuit_is_open(db_session):
    _reset_cb()
    email_svc._cb_consecutive_failures = email_svc._CB_FAILURE_THRESHOLD
    email_svc._cb_open_since = time.monotonic()

    await _make_pending(db_session, recipient_email="p@example.com")

    mock_send = MagicMock(return_value={"id": "resend-xyz"})
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    mock_send.assert_not_called()
    _reset_cb()


async def test_flush_retries_multiple_pending_records(db_session):
    _reset_cb()
    await _make_pending(db_session, recipient_email="a@example.com", entity_code="job00000001")
    await _make_pending(db_session, recipient_email="b@example.com", entity_code="job00000002")

    mock_send = MagicMock(return_value={"id": "resend-ok"})
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    assert mock_send.call_count == 2
    result = await db_session.execute(select(EmailPending))
    assert result.scalars().all() == []


async def test_flush_partial_success_mixed_outcomes(db_session):
    """One send succeeds, one fails — record counts must reflect it."""
    _reset_cb()
    await _make_pending(db_session, recipient_email="good@example.com", entity_code="job00000001")
    await _make_pending(db_session, recipient_email="bad@example.com", entity_code="job00000002")

    calls = [0]

    def _side_effect(params):
        calls[0] += 1
        if "good@example.com" in params["to"]:
            return {"id": "resend-good"}
        raise Exception("delivery failed")

    with (
        patch("resend.Emails.send", side_effect=_side_effect),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
    ):
        await _flush_pending_emails(db_session)

    result = await db_session.execute(select(EmailPending))
    remaining = result.scalars().all()
    assert len(remaining) == 1
    assert remaining[0].recipient_email == "bad@example.com"
    assert remaining[0].attempt_count == 1


# ---------------------------------------------------------------------------
# _send integration: pending queue wired up correctly
# ---------------------------------------------------------------------------


async def test_send_saves_to_pending_on_all_retries_exhausted(db_session):
    _reset_cb()

    mock_send = MagicMock(side_effect=Exception("timeout"))
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
        patch("app.services.email_service._flush_pending_emails", new_callable=AsyncMock),
        patch("asyncio.sleep", new_callable=AsyncMock),
    ):
        result = await email_svc._send(
            db_session,
            "verification",
            "c@example.com",
            "Verify",
            "<p>Verify</p>",
            "Verify",
            "job",
            "job00000001",
        )

    assert result is False
    rows = (await db_session.execute(select(EmailPending))).scalars().all()
    assert len(rows) == 1
    assert rows[0].recipient_email == "c@example.com"
    assert rows[0].subject == "Verify"
    _reset_cb()


async def test_send_calls_flush_before_sending(db_session):
    _reset_cb()

    mock_flush = AsyncMock()
    mock_send = MagicMock(return_value={"id": "resend-ok"})
    with (
        patch("resend.Emails.send", mock_send),
        patch("app.services.email_service._log_email", new_callable=AsyncMock),
        patch("app.services.email_service._flush_pending_emails", mock_flush),
    ):
        result = await email_svc._send(
            db_session,
            "verification",
            "d@example.com",
            "Verify",
            "<p>Verify</p>",
            "Verify",
            "job",
            "job00000002",
        )

    assert result is True
    mock_flush.assert_called_once_with(db_session)
    _reset_cb()
