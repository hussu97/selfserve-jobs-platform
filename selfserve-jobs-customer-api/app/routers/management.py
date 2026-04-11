from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session
from app.schemas.common import MessageResponse
from app.schemas.verification import (
    ManagementLinkRequest,
    ValidateTokenResponse,
)
from app.services import email_service, job_service, profile_service

router = APIRouter(prefix="/api/v1/manage", tags=["management"])
settings = get_settings()


@router.post("/request-links", response_model=MessageResponse)
async def request_management_links(
    data: ManagementLinkRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
):
    entities = await profile_service.get_entities_for_email(
        db=db,
        email=data.email,
        frontend_url=settings.frontend_url,
    )

    if not entities:
        # Don't reveal if email exists or not — always return success
        return MessageResponse(
            message="If there are any active listings for this email, you will receive an email with management links."
        )

    background_tasks.add_task(
        email_service.send_management_links_email,
        db=db,
        email=data.email,
        entities=entities,
    )

    return MessageResponse(message="Management links sent. Please check your email.")


@router.get("/validate-token", response_model=ValidateTokenResponse)
async def validate_token(
    entity_type: str = Query(...),
    code: str = Query(...),
    token: str = Query(...),
    db: AsyncSession = Depends(get_session),
):
    if entity_type == "job":
        valid = await job_service.validate_token(db, code, token)
    elif entity_type == "profile":
        valid = await profile_service.validate_token(db, code, token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entity_type. Must be 'job' or 'profile'.",
        )

    return ValidateTokenResponse(
        valid=valid,
        entity_type=entity_type if valid else None,
        code=code if valid else None,
    )
