from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_current_session, get_session
from app.models.auth_session import AuthSession
from app.schemas.recruiter import RecruiterRegister, RecruiterRegisterResponse, RecruiterResponse
from app.services import email_service, recruiter_service, verification_service

router = APIRouter(prefix="/api/v1/recruiters", tags=["recruiters"])
settings = get_settings()


@router.post("/register", response_model=RecruiterRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_recruiter(
    data: RecruiterRegister,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
):
    """Register a new recruiter account. Sends a verification email."""
    if data.website:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

    recruiter = await recruiter_service.register_recruiter(db, data)

    if settings.is_production:
        if await verification_service.is_email_verified(db, recruiter.email):
            # Email already verified from a previous flow — skip straight to pending_approval
            await recruiter_service.activate_recruiter(db, recruiter.recruiter_code)
            message = "Your email is already verified. Your account is now pending review."
        else:
            verification = await verification_service.create_verification(
                db=db,
                entity_type="recruiter",
                entity_code=recruiter.recruiter_code,
            )
            background_tasks.add_task(
                email_service.send_recruiter_verification_email,
                db=db,
                email=recruiter.email,
                recruiter_code=recruiter.recruiter_code,
                verification_code=verification.verification_code,
                frontend_url=settings.frontend_url,
            )
            message = "Check your email to verify your address. After verification, your account will be reviewed."
    else:
        # Non-production: auto-advance to pending_approval
        await recruiter_service.activate_recruiter(db, recruiter.recruiter_code)
        message = "Recruiter registered (dev mode — email skipped). Account is pending approval."

    # Notify admin of new recruiter registration (non-blocking)
    background_tasks.add_task(
        email_service.send_admin_new_recruiter_notification,
        db=db,
        recruiter_name=recruiter.name,
        recruiter_email=recruiter.email,
        recruiter_linkedin=recruiter.linkedin_profile_url,
        recruiter_code=recruiter.recruiter_code,
        frontend_url=settings.frontend_url,
        admin_email=settings.admin_notification_email,
    )

    return RecruiterRegisterResponse(code=recruiter.recruiter_code, message=message)


@router.get("/me", response_model=RecruiterResponse)
async def get_recruiter_me(
    current_session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
):
    """Returns the current recruiter's profile. Requires authentication."""
    if current_session.user_type != "recruiter" or not current_session.recruiter_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for recruiter accounts only.",
        )
    recruiter = await recruiter_service.get_by_code(db, current_session.recruiter_code)
    return RecruiterResponse.from_orm(recruiter)
