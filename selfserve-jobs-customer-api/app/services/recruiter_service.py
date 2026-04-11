import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recruiter import Recruiter
from app.schemas.recruiter import RecruiterRegister
from app.services.code_generator import generate_code

logger = logging.getLogger(__name__)


async def register_recruiter(db: AsyncSession, data: RecruiterRegister) -> Recruiter:
    """Create a new recruiter account in pending_verification status."""
    # Check for duplicate email
    existing = await get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    recruiter = Recruiter(
        recruiter_code=generate_code(12),
        email=data.email,
        name=data.name,
        linkedin_profile_url=data.linkedin_profile_url,
        status="pending_verification",
    )
    db.add(recruiter)
    await db.flush()
    return recruiter


async def get_by_email(db: AsyncSession, email: str) -> Recruiter | None:
    result = await db.execute(select(Recruiter).where(Recruiter.email == email))
    return result.scalar_one_or_none()


async def get_by_code(db: AsyncSession, code: str) -> Recruiter:
    result = await db.execute(select(Recruiter).where(Recruiter.recruiter_code == code))
    recruiter = result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found")
    return recruiter


async def activate_recruiter(db: AsyncSession, code: str) -> Recruiter:
    """Move recruiter from pending_verification → pending_approval (email verified)."""
    recruiter = await get_by_code(db, code)
    recruiter.status = "pending_approval"
    await db.flush()
    return recruiter


async def activate_recruiter_by_email(db: AsyncSession, email: str) -> Recruiter | None:
    """Move recruiter to pending_approval by email. Used in verification flow."""
    recruiter = await get_by_email(db, email)
    if recruiter and recruiter.status == "pending_verification":
        recruiter.status = "pending_approval"
        await db.flush()
    return recruiter


async def approve_recruiter(db: AsyncSession, code: str) -> Recruiter:
    """Move recruiter from pending_approval → active (admin approved)."""
    recruiter = await get_by_code(db, code)
    if recruiter.status not in ("pending_approval", "pending_verification"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recruiter cannot be approved from status '{recruiter.status}'",
        )
    recruiter.status = "active"
    await db.flush()
    return recruiter


async def reject_recruiter(db: AsyncSession, code: str) -> Recruiter:
    """Move recruiter to rejected status and invalidate all active sessions."""
    from sqlalchemy import delete

    from app.models.auth_session import AuthSession

    recruiter = await get_by_code(db, code)
    recruiter.status = "rejected"
    await db.execute(delete(AuthSession).where(AuthSession.email == recruiter.email))
    await db.flush()
    return recruiter


async def is_active_recruiter(db: AsyncSession, email: str) -> bool:
    recruiter = await get_by_email(db, email)
    return recruiter is not None and recruiter.status == "active"


async def list_pending(db: AsyncSession) -> list[Recruiter]:
    result = await db.execute(
        select(Recruiter).where(Recruiter.status == "pending_approval").order_by(Recruiter.created_at.asc())
    )
    return list(result.scalars().all())
