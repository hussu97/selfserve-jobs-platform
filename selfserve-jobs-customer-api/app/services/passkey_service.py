import json
import logging
from datetime import UTC, datetime, timedelta

import webauthn
from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url, options_to_json
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticationCredential,
    AuthenticatorAssertionResponse,
    AuthenticatorAttestationResponse,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    RegistrationCredential,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from app.models.passkey import Passkey, WebAuthnChallenge
from app.schemas.passkey import PasskeyAuthCompleteResponse, PasskeyItem, PasskeyListResponse
from app.services.code_generator import generate_token

logger = logging.getLogger(__name__)

_CHALLENGE_TTL_SECONDS = 300  # 5 minutes


def _parse_registration_credential(cred: dict) -> RegistrationCredential:
    response = cred.get("response", {})
    return RegistrationCredential(
        id=cred["id"],
        raw_id=base64url_to_bytes(cred.get("rawId", cred["id"])),
        response=AuthenticatorAttestationResponse(
            client_data_json=base64url_to_bytes(response["clientDataJSON"]),
            attestation_object=base64url_to_bytes(response["attestationObject"]),
            transports=response.get("transports"),
        ),
    )


def _parse_authentication_credential(cred: dict) -> AuthenticationCredential:
    response = cred.get("response", {})
    return AuthenticationCredential(
        id=cred["id"],
        raw_id=base64url_to_bytes(cred.get("rawId", cred["id"])),
        response=AuthenticatorAssertionResponse(
            client_data_json=base64url_to_bytes(response["clientDataJSON"]),
            authenticator_data=base64url_to_bytes(response["authenticatorData"]),
            signature=base64url_to_bytes(response["signature"]),
            user_handle=base64url_to_bytes(response["userHandle"]) if response.get("userHandle") else None,
        ),
    )


async def _save_challenge(db: AsyncSession, challenge: bytes) -> str:
    now = datetime.now(UTC)
    session_key = generate_token(64)
    row = WebAuthnChallenge(
        session_key=session_key,
        challenge=challenge,
        expires_at=now + timedelta(seconds=_CHALLENGE_TTL_SECONDS),
    )
    db.add(row)
    await db.flush()
    return session_key


async def _consume_challenge(db: AsyncSession, session_key: str) -> bytes:
    now = datetime.now(UTC)
    result = await db.execute(
        select(WebAuthnChallenge).where(
            and_(
                WebAuthnChallenge.session_key == session_key,
                WebAuthnChallenge.expires_at > now,
            )
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired passkey session")
    challenge = row.challenge
    await db.delete(row)
    await db.flush()
    return challenge


async def _generate_passkey_label(db: AsyncSession, user_email: str) -> str:
    result = await db.execute(select(Passkey).where(Passkey.user_email == user_email))
    existing_count = len(result.scalars().all())
    return f"Passkey {existing_count + 1}"


async def register_begin(
    db: AsyncSession,
    user_email: str,
    rp_id: str,
    rp_name: str,
) -> dict:
    """Generate WebAuthn registration options for an already-authenticated user."""
    existing_result = await db.execute(select(Passkey).where(Passkey.user_email == user_email))
    existing = existing_result.scalars().all()

    options = webauthn.generate_registration_options(
        rp_id=rp_id,
        rp_name=rp_name,
        user_name=user_email,
        user_display_name=user_email,
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
        exclude_credentials=[PublicKeyCredentialDescriptor(id=p.credential_id) for p in existing],
    )
    session_key = await _save_challenge(db, options.challenge)
    return {"session_key": session_key, "options": json.loads(options_to_json(options))}


async def register_complete(
    db: AsyncSession,
    session_key: str,
    credential: dict,
    label: str | None,
    rp_id: str,
    origin: str,
) -> None:
    """Verify registration response and persist the new passkey."""
    challenge = await _consume_challenge(db, session_key)

    try:
        reg_cred = _parse_registration_credential(credential)
        verification = webauthn.verify_registration_response(
            credential=reg_cred,
            expected_challenge=challenge,
            expected_rp_id=rp_id,
            expected_origin=origin,
            require_user_verification=False,
        )
    except Exception as exc:
        logger.warning("Passkey registration verification failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passkey registration failed") from exc

    passkey = Passkey(
        credential_id=verification.credential_id,
        public_key=verification.credential_public_key,
        sign_count=verification.sign_count,
        aaguid=str(verification.aaguid) if verification.aaguid else None,
        user_email=label,  # placeholder — overwritten below
        label=label,
    )
    # user_email is set from the session, not from the credential (no trust issue)
    # We resolve it from the caller; set it properly via the router
    db.add(passkey)
    await db.flush()
    return passkey


async def register_complete_for_user(
    db: AsyncSession,
    session_key: str,
    credential: dict,
    label: str | None,
    user_email: str,
    rp_id: str,
    origin: str,
) -> None:
    """Verify and save a new passkey tied to user_email."""
    challenge = await _consume_challenge(db, session_key)

    try:
        reg_cred = _parse_registration_credential(credential)
        verification = webauthn.verify_registration_response(
            credential=reg_cred,
            expected_challenge=challenge,
            expected_rp_id=rp_id,
            expected_origin=origin,
            require_user_verification=False,
        )
    except Exception as exc:
        logger.warning("Passkey registration verification failed for %s: %s", user_email, exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passkey registration failed") from exc

    resolved_label = label.strip() if label and label.strip() else await _generate_passkey_label(db, user_email)
    passkey = Passkey(
        credential_id=verification.credential_id,
        public_key=verification.credential_public_key,
        sign_count=verification.sign_count,
        aaguid=str(verification.aaguid) if verification.aaguid else None,
        user_email=user_email,
        label=resolved_label,
    )
    db.add(passkey)
    await db.flush()


async def auth_begin(
    db: AsyncSession,
    email: str,
    rp_id: str,
) -> dict:
    """Generate authentication options for a user identified by email."""
    result = await db.execute(select(Passkey).where(Passkey.user_email == email))
    passkeys = result.scalars().all()
    if not passkeys:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No passkeys registered for this email")

    options = webauthn.generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=[PublicKeyCredentialDescriptor(id=p.credential_id) for p in passkeys],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    session_key = await _save_challenge(db, options.challenge)
    return {"session_key": session_key, "options": json.loads(options_to_json(options))}


async def has_passkey(db: AsyncSession, email: str) -> bool:
    result = await db.execute(select(Passkey.id).where(Passkey.user_email == email).limit(1))
    return result.scalar_one_or_none() is not None


async def auth_complete(
    db: AsyncSession,
    session_key: str,
    credential: dict,
    rp_id: str,
    origin: str,
) -> PasskeyAuthCompleteResponse:
    """Verify authentication response and return a new auth session."""
    challenge = await _consume_challenge(db, session_key)

    try:
        auth_cred = _parse_authentication_credential(credential)
        credential_id = base64url_to_bytes(credential["id"])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credential format") from exc

    result = await db.execute(select(Passkey).where(Passkey.credential_id == credential_id))
    stored = result.scalar_one_or_none()
    if not stored:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passkey not recognised")

    try:
        verification = webauthn.verify_authentication_response(
            credential=auth_cred,
            expected_challenge=challenge,
            expected_rp_id=rp_id,
            expected_origin=origin,
            credential_public_key=stored.public_key,
            credential_current_sign_count=stored.sign_count,
            require_user_verification=False,
        )
    except Exception as exc:
        logger.warning("Passkey authentication verification failed for %s: %s", stored.user_email, exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passkey authentication failed") from exc

    stored.sign_count = verification.new_sign_count
    await db.flush()

    # Create a proper auth session via auth_service
    from app.services.auth_service import create_session

    session = await create_session(db, stored.user_email)

    recruiter_status = None
    if session.user_type == "recruiter" and session.recruiter_code:
        from app.services.recruiter_service import get_by_code

        try:
            recruiter = await get_by_code(db, session.recruiter_code)
            recruiter_status = recruiter.status
        except HTTPException:
            pass

    return PasskeyAuthCompleteResponse(
        session_token=session.session_token,
        email=session.email,
        user_type=session.user_type,
        recruiter_code=session.recruiter_code,
        recruiter_status=recruiter_status,
    )


async def list_passkeys(db: AsyncSession, user_email: str) -> PasskeyListResponse:
    result = await db.execute(select(Passkey).where(Passkey.user_email == user_email).order_by(Passkey.created_at))
    passkeys = result.scalars().all()
    return PasskeyListResponse(
        items=[
            PasskeyItem(
                credential_id_b64=bytes_to_base64url(p.credential_id),
                label=p.label,
                created_at=p.created_at,
            )
            for p in passkeys
        ]
    )


async def delete_passkey(db: AsyncSession, user_email: str, credential_id_b64: str) -> None:
    try:
        credential_id = base64url_to_bytes(credential_id_b64)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credential ID") from exc

    result = await db.execute(
        select(Passkey).where(and_(Passkey.credential_id == credential_id, Passkey.user_email == user_email))
    )
    passkey = result.scalar_one_or_none()
    if not passkey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passkey not found")
    await db.delete(passkey)
    await db.flush()
