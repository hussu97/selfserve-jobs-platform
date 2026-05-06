from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_current_session, get_session
from app.models.auth_session import AuthSession
from app.schemas.common import MessageResponse
from app.schemas.passkey import (
    PasskeyAuthBeginRequest,
    PasskeyAuthBeginResponse,
    PasskeyAuthCompleteRequest,
    PasskeyAuthCompleteResponse,
    PasskeyAvailabilityResponse,
    PasskeyListResponse,
    PasskeyRegisterBeginResponse,
    PasskeyRegisterCompleteRequest,
)
from app.services import passkey_service

router = APIRouter(prefix="/api/v1/passkey", tags=["passkey"])
settings = get_settings()


@router.get("/register/begin", response_model=PasskeyRegisterBeginResponse)
async def register_begin(
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
) -> PasskeyRegisterBeginResponse:
    """Generate WebAuthn registration options. Requires an active session."""
    result = await passkey_service.register_begin(
        db,
        user_email=session.email,
        rp_id=settings.webauthn_rp_id,
        rp_name=settings.webauthn_rp_name,
    )
    return PasskeyRegisterBeginResponse(**result)


@router.post("/register/complete", response_model=MessageResponse)
async def register_complete(
    body: PasskeyRegisterCompleteRequest,
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    """Verify and save a new passkey for the authenticated user."""
    await passkey_service.register_complete_for_user(
        db,
        session_key=body.session_key,
        credential=body.credential,
        label=body.label,
        user_email=session.email,
        rp_id=settings.webauthn_rp_id,
        origin=settings.webauthn_origin,
    )
    return MessageResponse(message="Passkey registered successfully")


@router.post("/auth/begin", response_model=PasskeyAuthBeginResponse)
async def auth_begin(
    body: PasskeyAuthBeginRequest,
    db: AsyncSession = Depends(get_session),
) -> PasskeyAuthBeginResponse:
    """Generate WebAuthn authentication options for a given email."""
    email = body.email.strip().lower()
    result = await passkey_service.auth_begin(
        db,
        email=email,
        rp_id=settings.webauthn_rp_id,
    )
    return PasskeyAuthBeginResponse(**result)


@router.post("/auth/complete", response_model=PasskeyAuthCompleteResponse)
async def auth_complete(
    body: PasskeyAuthCompleteRequest,
    db: AsyncSession = Depends(get_session),
) -> PasskeyAuthCompleteResponse:
    """Verify authentication and return a new session token."""
    return await passkey_service.auth_complete(
        db,
        session_key=body.session_key,
        credential=body.credential,
        rp_id=settings.webauthn_rp_id,
        origin=settings.webauthn_origin,
    )


@router.get("/availability", response_model=PasskeyAvailabilityResponse)
async def passkey_availability(
    email: str = Query(...),
    admin_only: bool = Query(False),
    db: AsyncSession = Depends(get_session),
) -> PasskeyAvailabilityResponse:
    """Return whether the normalized email has at least one registered passkey."""
    normalized_email = email.strip().lower()
    if admin_only and normalized_email not in settings.admin_email_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin email")
    return PasskeyAvailabilityResponse(has_passkey=await passkey_service.has_passkey(db, normalized_email))


@router.get("/", response_model=PasskeyListResponse)
async def list_passkeys(
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
) -> PasskeyListResponse:
    """List all passkeys for the authenticated user."""
    return await passkey_service.list_passkeys(db, session.email)


@router.delete("/{credential_id_b64}", response_model=MessageResponse)
async def delete_passkey(
    credential_id_b64: str,
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    """Delete a passkey. Only the owning user can delete their own passkeys."""
    await passkey_service.delete_passkey(db, session.email, credential_id_b64)
    return MessageResponse(message="Passkey deleted")


@router.post("/auth/begin/admin", response_model=PasskeyAuthBeginResponse)
async def auth_begin_admin(
    body: PasskeyAuthBeginRequest,
    db: AsyncSession = Depends(get_session),
) -> PasskeyAuthBeginResponse:
    """Auth begin restricted to admin emails only."""
    email = body.email.strip().lower()
    if email not in settings.admin_email_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin email")
    result = await passkey_service.auth_begin(db, email=email, rp_id=settings.webauthn_rp_id)
    return PasskeyAuthBeginResponse(**result)


@router.post("/auth/complete/admin", response_model=PasskeyAuthCompleteResponse)
async def auth_complete_admin(
    body: PasskeyAuthCompleteRequest,
    db: AsyncSession = Depends(get_session),
) -> PasskeyAuthCompleteResponse:
    """Verify auth and return session — rejects if resulting session is not admin."""
    result = await passkey_service.auth_complete(
        db,
        session_key=body.session_key,
        credential=body.credential,
        rp_id=settings.webauthn_rp_id,
        origin=settings.webauthn_origin,
    )
    if result.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return result
