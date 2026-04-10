from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session
from app.models.job import Job
from app.models.profile import Profile
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
    entity_code = data.entity_code
    edit_token = None

    if data.entity_type == "job":
        query = select(Job).where(
            and_(
                Job.email == data.email,
                Job.status == "pending_verification",
            )
        )
        if entity_code:
            query = query.where(Job.job_code == entity_code)

        result = await db.execute(query)
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pending job not found for this email",
            )
        entity_code = entity.job_code
        edit_token = entity.edit_token

    elif data.entity_type == "profile":
        query = select(Profile).where(
            and_(
                Profile.email == data.email,
                Profile.status == "pending_verification",
            )
        )
        if entity_code:
            query = query.where(Profile.profile_code == entity_code)

        result = await db.execute(query)
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pending profile not found for this email",
            )
        entity_code = entity.profile_code
        edit_token = entity.edit_token

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entity type",
        )

    # Rate limit check
    await verification_service.check_resend_rate_limit(db, data.entity_type, entity_code)

    # Create new verification record
    verification = await verification_service.create_verification(
        db=db,
        email=data.email,
        entity_type=data.entity_type,
        entity_code=entity_code,
    )

    # Send email
    await email_service.send_verification_email(
        db=db,
        email=data.email,
        entity_type=data.entity_type,
        entity_code=entity_code,
        verification_code=verification.verification_code,
        edit_token=edit_token,
        frontend_url=settings.frontend_url,
    )

    return MessageResponse(message="Verification email sent. Please check your inbox.")
