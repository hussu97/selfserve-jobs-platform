import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session
from app.schemas.recruiter import RecruiterResponse
from app.services import email_service, recruiter_service

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
settings = get_settings()


def _verify_admin_secret(x_admin_secret: str = Header(..., alias="X-Admin-Secret")) -> str:
    if not settings.admin_api_secret or not secrets.compare_digest(x_admin_secret, settings.admin_api_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin secret",
        )
    return x_admin_secret


@router.get("/recruiters/pending", response_model=list[RecruiterResponse])
async def list_pending_recruiters(
    _secret: str = Depends(_verify_admin_secret),
    db: AsyncSession = Depends(get_session),
):
    """List all recruiters awaiting approval."""
    recruiters = await recruiter_service.list_pending(db)
    return [RecruiterResponse.from_orm(r) for r in recruiters]


@router.post("/recruiters/{code}/approve", response_model=RecruiterResponse)
async def approve_recruiter(
    code: str,
    _secret: str = Depends(_verify_admin_secret),
    db: AsyncSession = Depends(get_session),
):
    """Approve a pending recruiter account."""
    recruiter = await recruiter_service.approve_recruiter(db, code)

    if settings.is_production:
        await email_service.send_recruiter_approved_email(
            db=db,
            email=recruiter.email,
            recruiter_code=recruiter.recruiter_code,
            frontend_url=settings.frontend_url,
        )

    return RecruiterResponse.from_orm(recruiter)


@router.post("/recruiters/{code}/reject", response_model=RecruiterResponse)
async def reject_recruiter(
    code: str,
    _secret: str = Depends(_verify_admin_secret),
    db: AsyncSession = Depends(get_session),
):
    """Reject a recruiter account application."""
    recruiter = await recruiter_service.reject_recruiter(db, code)

    if settings.is_production:
        await email_service.send_recruiter_rejected_email(
            db=db,
            email=recruiter.email,
            recruiter_code=recruiter.recruiter_code,
            frontend_url=settings.frontend_url,
        )

    return RecruiterResponse.from_orm(recruiter)
