from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session
from app.schemas.common import MessageResponse
from app.schemas.verification import (
    ResendVerificationRequest,
    VerificationRequest,
    VerificationResponse,
)
from app.services import email_service, verification_service

router = APIRouter(prefix="/api/v1/verify", tags=["verification"])
settings = get_settings()


@router.post("", response_model=VerificationResponse)
async def verify_email(
    data: VerificationRequest,
    db: AsyncSession = Depends(get_session),
):
    result = await verification_service.verify_code(db, data.code)
    entity_type = result["entity_type"]
    if entity_type == "recruiter":
        message = "Email verified. Your recruiter account is under review — we'll notify you when approved."
    else:
        message = "Email verified successfully. Your listing is now active."
    return VerificationResponse(
        success=True,
        message=message,
        entity_type=entity_type,
        code=result["entity_code"],
        session_token=result.get("session_token"),
        email=result.get("email"),
        recruiter_status=result.get("recruiter_status"),
    )


@router.post("/resend", response_model=MessageResponse)
async def resend_verification(
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_session),
):
    entity_code, edit_token = await verification_service.get_pending_entity_for_resend(
        db=db,
        entity_type=data.entity_type,
        email=data.email,
        entity_code=data.entity_code,
    )

    await verification_service.check_resend_rate_limit(db, data.entity_type, entity_code)

    verification = await verification_service.create_verification(
        db=db,
        email=data.email,
        entity_type=data.entity_type,
        entity_code=entity_code,
    )

    sent = await email_service.send_verification_email(
        db=db,
        email=data.email,
        entity_type=data.entity_type,
        entity_code=entity_code,
        verification_code=verification.verification_code,
        edit_token=edit_token,
        frontend_url=settings.frontend_url,
    )
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification email could not be sent. Please try again later.",
        )

    return MessageResponse(message="Verification email sent. Please check your inbox.")
